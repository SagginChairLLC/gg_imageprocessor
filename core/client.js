/// <reference types="@citizenfx/client" />

const config = JSON.parse(
    LoadResourceFile(GetCurrentResourceName(), "config.json")
);

const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

let cam;
const playerId = PlayerId();

let vehicle_list = {};

onNet("receiveConfig", (c) => {
    vehicle_list = c;
});

function ApplyVehicleUpgrades(veh, conf) {
    if (veh == 0 || !DoesEntityExist(veh) || typeof conf !== "object") return;
    SetVehicleModKit(veh, 0);

    if (conf.wheelType !== undefined) SetVehicleWheelType(veh, conf.wheelType);
    if (conf.windowTint !== undefined)
        SetVehicleWindowTint(veh, conf.windowTint);
    if (conf.plateIndex !== undefined)
        SetVehicleNumberPlateTextIndex(veh, conf.plateIndex);
    if (conf.tyresCanBurst !== undefined)
        SetVehicleTyresCanBurst(
            veh,
            conf.tyresCanBurst === true || conf.tyresCanBurst === 1
        );

    const modsSeq = conf.mods;
    if (Array.isArray(modsSeq)) {
        for (let i = 0; i <= 48; i++) {
            const v = modsSeq[i];
            if (typeof v === "number" && v >= 0) {
                SetVehicleMod(veh, i, v, false);
            } else {
                RemoveVehicleMod(veh, i);
            }
        }
        const liv = modsSeq[48];
        if (typeof liv === "number" && liv >= 0) {
            SetVehicleMod(veh, 48, liv, false);
            const lc = GetVehicleLiveryCount(veh);
            if (lc && lc > 0) SetVehicleLivery(veh, liv);
        }
    }

    if (conf.wheels) {
        if (conf.wheels[23] !== undefined)
            SetVehicleMod(veh, 23, conf.wheels[23], conf.wheels.c23 === true);
        if (conf.wheels[24] !== undefined)
            SetVehicleMod(veh, 24, conf.wheels[24], conf.wheels.c24 === true);
    }

    if (conf.toggles) {
        for (const [i, v] of Object.entries(conf.toggles)) {
            if (v !== undefined)
                ToggleVehicleMod(veh, parseInt(i), v === true || v === 1);
        }
    }

    if (conf.extras) {
        for (const [i, v] of Object.entries(conf.extras)) {
            if (DoesExtraExist(veh, parseInt(i)))
                SetVehicleExtra(
                    veh,
                    parseInt(i),
                    v === true || v === 1 ? 0 : 1
                );
        }
    }
}

async function takeScreenshotForVehicle(vehicle, hash, vehicleId) {
    setWeatherTime();

    await Delay(500);

    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        cam = null;
    }

    let [[minDimX, minDimY, minDimZ], [maxDimX, maxDimY, maxDimZ]] =
        GetModelDimensions(hash);
    let modelSize = {
        x: maxDimX - minDimX,
        y: maxDimY - minDimY,
        z: maxDimZ - minDimZ,
    };
    let fov = Math.min(
        (Math.max(modelSize.x, modelSize.y, modelSize.z) / 0.15) * 10,
        60
    );

    const [objectX, objectY, objectZ] = GetEntityCoords(vehicle, false);

    const center = {
        x: objectX + (minDimX + maxDimX) / 2,
        y: objectY + (minDimY + maxDimY) / 2,
        z: objectZ + (minDimZ + maxDimZ) / 2,
    };

    let camPos = {
        x:
            center.x +
            Math.max(modelSize.x, modelSize.y, modelSize.z) * Math.cos(340),
        y:
            center.y +
            Math.max(modelSize.x, modelSize.y, modelSize.z) * Math.sin(340),
        z: center.z + modelSize.z / 2,
    };

    cam = CreateCamWithParams(
        "DEFAULT_SCRIPTED_CAMERA",
        camPos.x,
        camPos.y,
        camPos.z + 0.5,
        0,
        0,
        0,
        fov,
        true,
        0
    );

    PointCamAtCoord(cam, center.x, center.y, center.z);
    SetCamActive(cam, true);
    RenderScriptCams(true, false, 0, true, false, 0);

    await Delay(50);

    emitNet("takeScreenshot", `${vehicleId}`);

    await Delay(2000);

    return;
}

function setWeatherTime() {
    if (config.debug) console.log(`DEBUG: Setting Weather & Time`);
    SetRainLevel(0.0);
    SetWeatherTypePersist("EXTRASUNNY");
    SetWeatherTypeNow("EXTRASUNNY");
    SetWeatherTypeNowPersist("EXTRASUNNY");
    NetworkOverrideClockTime(12, 0, 0);
    NetworkOverrideClockMillisecondsPerGameMinute(1000000);
}

function stopWeatherResource() {
    if (config.debug) console.log(`DEBUG: Stopping Weather Resource`);
    if (
        GetResourceState("qb-weathersync") == "started" ||
        GetResourceState("qbx_weathersync") == "started"
    ) {
        TriggerEvent("qb-weathersync:client:DisableSync");
        return true;
    } else if (GetResourceState("weathersync") == "started") {
        TriggerEvent("weathersync:toggleSync");
        return true;
    } else if (GetResourceState("esx_wsync") == "started") {
        SendNUIMessage({
            error: "weathersync",
        });
        return false;
    } else if (GetResourceState("cd_easytime") == "started") {
        TriggerEvent("cd_easytime:PauseSync", false);
        return true;
    } else if (
        GetResourceState("vSync") == "started" ||
        GetResourceState("Renewed-Weathersync") == "started"
    ) {
        TriggerEvent("vSync:toggle", false);
        return true;
    }
    return true;
}

function startWeatherResource() {
    if (config.debug) console.log(`DEBUG: Starting Weather Resource again`);
    if (
        GetResourceState("qb-weathersync") == "started" ||
        GetResourceState("qbx_weathersync") == "started"
    ) {
        TriggerEvent("qb-weathersync:client:EnableSync");
    } else if (GetResourceState("weathersync") == "started") {
        TriggerEvent("weathersync:toggleSync");
    } else if (GetResourceState("cd_easytime") == "started") {
        TriggerEvent("cd_easytime:PauseSync", true);
    } else if (
        GetResourceState("vSync") == "started" ||
        GetResourceState("Renewed-Weathersync") == "started"
    ) {
        TriggerEvent("vSync:toggle", true);
    }
}

function createGreenScreenVehicle(vehicleHash, vehicleModel) {
    return new Promise(async (resolve, reject) => {
        if (config.debug)
            console.log(`DEBUG: Spawning Vehicle ${vehicleModel}`);
        const timeout = setTimeout(() => {
            resolve(null);
        }, 5000);
        if (!HasModelLoaded(vehicleHash)) {
            RequestModel(vehicleHash);
            while (!HasModelLoaded(vehicleHash)) {
                await Delay(100);
            }
        }
        const vehicle = CreateVehicle(
            vehicleHash,
            config.greenScreenVehiclePosition.x,
            config.greenScreenVehiclePosition.y,
            config.greenScreenVehiclePosition.z,
            0,
            true,
            true
        );
        if (vehicle === 0) {
            clearTimeout(timeout);
            resolve(null);
        }
        clearTimeout(timeout);
        resolve(vehicle);
    });
}

RegisterCommand("screenshotvehicle", async (source, args) => {
    const ped = PlayerPedId();
    const type = args[0].toLowerCase();

    if (
        !vehicle_list ||
        typeof vehicle_list !== "object" ||
        Object.keys(vehicle_list).length === 0
    ) {
        console.log(
            "ERROR: Vehicle list not loaded. Make sure receiveConfig event has been triggered."
        );
        return;
    }

    if (!stopWeatherResource()) return;

    DisableIdleCamera(true);
    SetEntityCoords(
        ped,
        config.greenScreenHiddenSpot.x,
        config.greenScreenHiddenSpot.y,
        config.greenScreenHiddenSpot.z,
        false,
        false,
        false
    );
    SetPlayerControl(playerId, false);

    ClearAreaOfVehicles(
        config.greenScreenVehiclePosition.x,
        config.greenScreenVehiclePosition.y,
        config.greenScreenVehiclePosition.z,
        10,
        false,
        false,
        false,
        false,
        false
    );

    await Delay(100);

    if (type === "all") {
        SendNUIMessage({
            start: true,
        });

        const vehicleKeys = Object.keys(vehicle_list);
        const totalVehicles = vehicleKeys.length;
        let currentVehicle = 0;

        for (let i = 0; i < vehicleKeys.length; i++) {
            const vehicleKey = vehicleKeys[i];
            const vehicleData = vehicle_list[vehicleKey];
            const vehicleModel = vehicleData.vehicle;
            const vehicleHash = GetHashKey(vehicleModel);
            if (!IsModelValid(vehicleHash)) continue;

            const vehicleClass = GetVehicleClassFromName(vehicleHash);

            if (!config.includedVehicleClasses[vehicleClass]) {
                SetModelAsNoLongerNeeded(vehicleHash);
                continue;
            }

            currentVehicle++;

            SendNUIMessage({
                type: `${vehicleModel}`,
                value: currentVehicle,
                max: totalVehicles,
            });

            const vehicle = await createGreenScreenVehicle(
                vehicleHash,
                vehicleModel
            );

            if (vehicle === 0 || vehicle === null) {
                console.log(
                    `ERROR: Could not spawn vehicle. Broken Vehicle: ${vehicleModel}`
                );
                continue;
            }

            SetEntityRotation(
                vehicle,
                config.greenScreenVehicleRotation.x,
                config.greenScreenVehicleRotation.y,
                config.greenScreenVehicleRotation.z,
                0,
                false
            );

            FreezeEntityPosition(vehicle, true);

            SetVehicleWindowTint(vehicle, 1);

            if (vehicleData.color.primary.r !== undefined) {
                SetVehicleCustomPrimaryColour(
                    vehicle,
                    vehicleData.color.primary.r,
                    vehicleData.color.primary.g,
                    vehicleData.color.primary.b
                );
            }

            if (vehicleData.color.secondary.r !== undefined) {
                SetVehicleCustomSecondaryColour(
                    vehicle,
                    vehicleData.color.secondary.r,
                    vehicleData.color.secondary.g,
                    vehicleData.color.secondary.b
                );
            }

            SetVehicleExtraColours(vehicle, 0, 0);
            SetVehicleNeonLightsColour(vehicle, 0, 0, 0);
            SetVehicleNeonLightEnabled(vehicle, 0, false);
            SetVehicleNeonLightEnabled(vehicle, 1, false);
            SetVehicleNeonLightEnabled(vehicle, 2, false);
            SetVehicleNeonLightEnabled(vehicle, 3, false);
            SetVehicleDirtLevel(vehicle, 0.0);

            if (vehicleData.mods) {
                ApplyVehicleUpgrades(vehicle, vehicleData.mods);
            }

            await Delay(50);

            await takeScreenshotForVehicle(vehicle, vehicleHash, vehicleKey);

            DeleteEntity(vehicle);
            SetModelAsNoLongerNeeded(vehicleHash);
        }
        SendNUIMessage({
            end: true,
        });
    } else {
        const vehicleModel = type;
        const vehicleHash = GetHashKey(vehicleModel);
        if (IsModelValid(vehicleHash)) {
            const vehicleKey = Object.keys(vehicle_list).find(
                (key) => vehicle_list[key].vehicle === vehicleModel
            );
            const vehicleData = vehicleKey ? vehicle_list[vehicleKey] : null;

            if (!vehicleData) {
                console.log(
                    `ERROR: Vehicle ${vehicleModel} not found in vehicle list`
                );
                SetPlayerControl(playerId, true);
                startWeatherResource();
                return;
            }

            SendNUIMessage({
                type: `${vehicleModel}`,
                value: 1,
                max: 1,
            });

            const vehicle = await createGreenScreenVehicle(
                vehicleHash,
                vehicleModel
            );

            if (vehicle === 0 || vehicle === null) {
                console.log(
                    `ERROR: Could not spawn vehicle. Broken Vehicle: ${vehicleModel}`
                );
                SetPlayerControl(playerId, true);
                startWeatherResource();
                return;
            }

            SetEntityRotation(
                vehicle,
                config.greenScreenVehicleRotation.x,
                config.greenScreenVehicleRotation.y,
                config.greenScreenVehicleRotation.z,
                0,
                false
            );

            FreezeEntityPosition(vehicle, true);

            SetVehicleWindowTint(vehicle, 1);

            if (vehicleData.color.primary.r !== undefined) {
                SetVehicleCustomPrimaryColour(
                    vehicle,
                    vehicleData.color.primary.r,
                    vehicleData.color.primary.g,
                    vehicleData.color.primary.b
                );
            }

            if (vehicleData.color.secondary.r !== undefined) {
                SetVehicleCustomSecondaryColour(
                    vehicle,
                    vehicleData.color.secondary.r,
                    vehicleData.color.secondary.g,
                    vehicleData.color.secondary.b
                );
            }

            SetVehicleExtraColours(vehicle, 0, 0);
            SetVehicleNeonLightsColour(vehicle, 0, 0, 0);
            SetVehicleNeonLightEnabled(vehicle, 0, false);
            SetVehicleNeonLightEnabled(vehicle, 1, false);
            SetVehicleNeonLightEnabled(vehicle, 2, false);
            SetVehicleNeonLightEnabled(vehicle, 3, false);

            if (vehicleData.mods) {
                ApplyVehicleUpgrades(vehicle, vehicleData.mods);
            }

            await Delay(50);

            await takeScreenshotForVehicle(vehicle, vehicleHash, vehicleKey);

            DeleteEntity(vehicle);
            SetModelAsNoLongerNeeded(vehicleHash);
        } else {
            console.log("ERROR: Invalid vehicle model");
        }
    }
    SetPlayerControl(playerId, true);
    startWeatherResource();
    DestroyAllCams(true);
    DestroyCam(cam, true);
    RenderScriptCams(false, false, 0, true, false, 0);
    cam = null;
});

setImmediate(() => {
    emit("chat:addSuggestions", [
        {
            name: "/screenshotvehicle",
            help: "generate vehicle screenshots",
            params: [
                {
                    name: "model/all",
                    help: "The vehicle model or 'all' to screenshot all vehicles with their predefined colors",
                },
            ],
        },
    ]);
});

on("onResourceStop", (resName) => {
    if (GetCurrentResourceName() != resName) return;

    startWeatherResource();
    SetPlayerControl(playerId, true);
});
