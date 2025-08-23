local coords = vector3(-1324.13, -2257.61, 48.77)
local playerId = PlayerId()
local isScreenshotting = false
local currentVehicleIndex = 0
local totalVehicles = 0
local vehicleQueue = {}
local successfullyImaged = {}

local function drawGreenscreen()
    CreateThread(function()
        while isScreenshotting do
            Wait(0)
            DrawMarker(
                28,
                coords.x, coords.y, coords.z - 1.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                25.0, 25.0, 25.0,
                0, 255, 0, 255,
                false, true, 2, false, nil, nil, false
            )
        end
    end)
end

local function createGreenScreenVehicle(vehicleHash, vehicleName)
    local vehicle = nil
    
    CreateThread(function()
        local timeout = GetGameTimer() + 5000
        
        if not HasModelLoaded(vehicleHash) then
            RequestModel(vehicleHash)
            while not HasModelLoaded(vehicleHash) and GetGameTimer() < timeout do
                Wait(100)
            end
        end
        
        if GetGameTimer() >= timeout then
            vehicle = nil
            return
        end
        
        vehicle = CreateVehicle(vehicleHash, coords.x, coords.y, coords.z, 0, true, true)
        
        if vehicle == 0 then
            vehicle = nil
        end
    end)
    
    while vehicle == nil and GetGameTimer() < GetGameTimer() + 5000 do
        Wait(50)
    end
    
    return vehicle
end

local function setupVehicle(vehicle, data)
    SetEntityRotation(vehicle, 0.0, 0.0, 264.03, 0, false)
    FreezeEntityPosition(vehicle, true)
    SetVehicleWindowTint(vehicle, 1)
    SetVehicleExtraColours(vehicle, 0, 0)
    SetVehicleNeonLightsColour(vehicle, 0, 0, 0)
    SetVehicleNeonLightEnabled(vehicle, 0, false)
    SetVehicleNeonLightEnabled(vehicle, 1, false)
    SetVehicleNeonLightEnabled(vehicle, 2, false)
    SetVehicleNeonLightEnabled(vehicle, 3, false)
    SetVehicleDirtLevel(vehicle, 0.0)

    if data.mods then
        lib.setVehicleProperties(vehicle, data.mods)
    end

    if data.color then
        SetVehicleCustomPrimaryColour(vehicle, data.color.primary.r, data.color.primary.g, data.color.primary.b)
        SetVehicleCustomSecondaryColour(vehicle, data.color.secondary.r, data.color.secondary.g, data.color.secondary.b)
    end
end

local function processNextVehicle(promiseObj)
    if currentVehicleIndex >= totalVehicles then
        TriggerEvent("gg_imageprocessor:client:stopVehicleCamera")
        isScreenshotting = false
        SendNUIMessage({ action = "hideProgress" })
        promiseObj:resolve(successfullyImaged)
        return
    end

    currentVehicleIndex = currentVehicleIndex + 1
    local vehicleData = vehicleQueue[currentVehicleIndex]
    local vehicleHash = GetHashKey(vehicleData.vehicle)

    SendNUIMessage({
        action = "updateProgress",
        current = currentVehicleIndex - 1,
        total = totalVehicles
    })

    if not IsModelValid(vehicleHash) then
        processNextVehicle(promiseObj)
        return
    end

    local vehicle = createGreenScreenVehicle(vehicleHash, vehicleData.vehicle)
    if not vehicle or vehicle == 0 then
        processNextVehicle(promiseObj)
        return
    end

    setupVehicle(vehicle, vehicleData)

    TriggerEvent("gg_imageprocessor:client:takeVehicleScreenshot", {
        vehicle = vehicle,
        hash = vehicleHash,
        vehicleId = vehicleData.id,
        onComplete = function(success)
            DeleteEntity(vehicle)
            SetModelAsNoLongerNeeded(vehicleHash)

            if success then
                table.insert(successfullyImaged, vehicleData.id)
            end

            CreateThread(function()
                Wait(500)
                processNextVehicle(promiseObj)
            end)
        end
    })
end

function ggimageprocessScreenshotVehicle(data)
    local promiseObj = promise.new()

    local ped = PlayerPedId()
    isScreenshotting = true
    currentVehicleIndex = 0
    successfullyImaged = {}

    local isActive, toggled = IsRadarEnabled(), false
    if isActive then
        DisplayRadar(false)
        toggled = true
    end

    drawGreenscreen()
    DisableIdleCamera(true)
    SetEntityCoords(ped, -1329.62, -2262.56, 14.78, false, false, false, false)
    SetPlayerControl(playerId, false)

    if data.vehicle then
        vehicleQueue = {data}
        totalVehicles = 1
    elseif type(data) == "table" and #data > 0 then
        vehicleQueue = data
        totalVehicles = #data
    else
        isScreenshotting = false
        SetPlayerControl(playerId, true)
        return false, {}
    end

    SendNUIMessage({
        action = "showProgress",
        current = 0,
        total = totalVehicles
    })

    TriggerEvent("gg_imageprocessor:client:setupCamera", {
        onReady = function(success)
            if success then
                CreateThread(function()
                    Wait(100)
                    processNextVehicle(promiseObj)
                end)
            else
                isScreenshotting = false
                SetPlayerControl(playerId, true)

                SendNUIMessage({ action = "hideProgress" })

                promiseObj:resolve({})
            end
        end
    })

    local result = Citizen.Await(promiseObj)
    if toggled then DisplayRadar(true) end
    return #result > 0, result
end


exports('ggimageprocessScreenshotVehicle', ggimageprocessScreenshotVehicle)



AddEventHandler("onResourceStop", function(resName)
    if GetCurrentResourceName() ~= resName then
        return
    end

    TriggerEvent("gg_imageprocessor:client:resetCameraSystem")
    isScreenshotting = false
    SetPlayerControl(playerId, true)
end)