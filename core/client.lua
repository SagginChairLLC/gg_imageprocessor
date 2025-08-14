
while GetResourceState('gg_boosting') ~= 'started' do Wait(1000) end

local vehicleData = exports.gg_boosting:GetVehicleData()

TriggerEvent('receiveConfig', vehicleData)

local coords = vector3(-1079.86, -2413.8, 37.82)
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        DrawMarker(
            28, -- Marker type 1 (cylinder/circle)
            coords.x, coords.y, coords.z - 1.0, -- Adjusted Z so marker appears on the ground
            0.0, 0.0, 0.0, -- Direction
            0.0, 0.0, 0.0, -- Rotation
            25.0, 25.0, 25.0, -- Scale (width, length, height)
            0, 255, 0, 255, -- Color (blue, with some transparency)
            false, true, 2, false, nil, nil, false
        )
    end
end)
