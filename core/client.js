/// <reference types="@citizenfx/client" />

const config = JSON.parse(
    LoadResourceFile(GetCurrentResourceName(), "config.json")
);

const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

let cam;
const playerId = PlayerId();

let vehicle_list = {};
let vehicle_colors = {};

onNet("receiveConfig", (config) => {
    vehicle_list = config.vehicles;
    vehicle_colors = config.vehicle_colors;
});

async function takeScreenshotForVehicle(
    vehicle,
    hash,
    model,
    primaryColor = 0
) {
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

    emitNet("takeScreenshot", `${model}`, "vehicles", parseInt(primaryColor));

    await Delay(2000);

    return;
}

function setWeatherTime() {
    if (config.debug) console.log(`DEBUG: Setting Weather & Time`);
    SetRainLevel(0.0);
    SetWeatherTypePersist("EXTRASUNNY");
    SetWeatherTypeNow("EXTRASUNNY");
    SetWeatherTypeNowPersist("EXTRASUNNY");
    NetworkOverrideClockTime(18, 0, 0);
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
        }, config.vehicleSpawnTimeout);
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
    const primarycolor = args[1] ? parseInt(args[1]) : null;
    const secondarycolor = args[2] ? parseInt(args[2]) : null;

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
        config.greenScreenPosition.x,
        config.greenScreenPosition.y,
        config.greenScreenPosition.z,
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
        for (let i = 0; i < vehicle_list.length; i++) {
            const vehicleModel = vehicle_list[i].vehicle;
            const vehicleHash = GetHashKey(vehicleModel);
            if (!IsModelValid(vehicleHash)) continue;

            const vehicleClass = GetVehicleClassFromName(vehicleHash);

            if (!config.includedVehicleClasses[vehicleClass]) {
                SetModelAsNoLongerNeeded(vehicleHash);
                continue;
            }

            SendNUIMessage({
                type: vehicleModel,
                value: i + 1,
                max: vehicle_list.length,
            });

            const vehicle = await createGreenScreenVehicle(
                vehicleHash,
                vehicleModel
            );

            if (vehicle === 0 || vehicle === null) {
                SetModelAsNoLongerNeeded(vehicleHash);
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

            // Set all colors to ensure consistency
            SetVehicleColours(vehicle, primarycolor || 0, 0); // Secondary always black
            SetVehicleExtraColours(vehicle, 0, 0); // Pearlescent and wheel color to black
            SetVehicleNeonLightsColour(vehicle, 0, 0, 0); // Neon lights off/black
            SetVehicleNeonLightEnabled(vehicle, 0, false); // Disable all neon lights
            SetVehicleNeonLightEnabled(vehicle, 1, false);
            SetVehicleNeonLightEnabled(vehicle, 2, false);
            SetVehicleNeonLightEnabled(vehicle, 3, false);
            SetVehicleDirtLevel(vehicle, 0.0); // Clean vehicle, no dirt
            SetVehicleDirtLevel(vehicle, 0.0); // Clean vehicle, no dirt

            await Delay(50);

            await takeScreenshotForVehicle(
                vehicle,
                vehicleHash,
                vehicleModel,
                primarycolor || 0
            );

            DeleteEntity(vehicle);
            SetModelAsNoLongerNeeded(vehicleHash);
        }
        SendNUIMessage({
            end: true,
        });
    } else if (type === "full") {
        const totalOperations = vehicle_list.length * vehicle_colors.length;
        let currentOperation = 0;

        SendNUIMessage({
            start: true,
        });

        for (let i = 0; i < vehicle_list.length; i++) {
            const vehicleModel = vehicle_list[i].vehicle;
            const vehicleHash = GetHashKey(vehicleModel);
            if (!IsModelValid(vehicleHash)) {
                currentOperation += vehicle_colors.length;
                continue;
            }

            const vehicleClass = GetVehicleClassFromName(vehicleHash);

            if (!config.includedVehicleClasses[vehicleClass]) {
                SetModelAsNoLongerNeeded(vehicleHash);
                currentOperation += vehicle_colors.length;
                continue;
            }

            for (let j = 0; j < vehicle_colors.length; j++) {
                const color_id = vehicle_colors[j].color_id;
                currentOperation++;

                SendNUIMessage({
                    type: `${vehicleModel}_color_${color_id}`,
                    value: currentOperation,
                    max: totalOperations,
                });

                const vehicle = await createGreenScreenVehicle(
                    vehicleHash,
                    vehicleModel
                );

                if (vehicle === 0 || vehicle === null) {
                    SetModelAsNoLongerNeeded(vehicleHash);
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

                // Set all colors to ensure consistency
                SetVehicleColours(vehicle, color_id, 0); // Secondary always black
                SetVehicleExtraColours(vehicle, 0, 0); // Pearlescent and wheel color to black
                SetVehicleNeonLightsColour(vehicle, 0, 0, 0); // Neon lights off/black
                SetVehicleNeonLightEnabled(vehicle, 0, false); // Disable all neon lights
                SetVehicleNeonLightEnabled(vehicle, 1, false);
                SetVehicleNeonLightEnabled(vehicle, 2, false);
                SetVehicleNeonLightEnabled(vehicle, 3, false);
                SetVehicleDirtLevel(vehicle, 0.0); // Clean vehicle, no dirt

                await Delay(50);

                await takeScreenshotForVehicle(
                    vehicle,
                    vehicleHash,
                    vehicleModel,
                    color_id
                );

                DeleteEntity(vehicle);
            }

            SetModelAsNoLongerNeeded(vehicleHash);
        }
        SendNUIMessage({
            end: true,
        });
    } else {
        const vehicleModel = type;
        const vehicleHash = GetHashKey(vehicleModel);
        if (IsModelValid(vehicleHash)) {
            SendNUIMessage({
                type: vehicleModel,
                value: 1,
                max: 1,
            });

            const vehicle = await createGreenScreenVehicle(
                vehicleHash,
                vehicleModel
            );

            if (vehicle === 0 || vehicle === null) {
                SetModelAsNoLongerNeeded(vehicleHash);
                console.log(
                    `ERROR: Could not spawn vehicle. Broken Vehicle: ${vehicleModel}`
                );
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

            // Set all colors to ensure consistency
            SetVehicleColours(vehicle, primarycolor || 0, 0); // Secondary always black
            SetVehicleExtraColours(vehicle, 0, 0); // Pearlescent and wheel color to black
            SetVehicleNeonLightsColour(vehicle, 0, 0, 0); // Neon lights off/black
            SetVehicleNeonLightEnabled(vehicle, 0, false); // Disable all neon lights
            SetVehicleNeonLightEnabled(vehicle, 1, false);
            SetVehicleNeonLightEnabled(vehicle, 2, false);
            SetVehicleNeonLightEnabled(vehicle, 3, false);

            await Delay(50);

            await takeScreenshotForVehicle(
                vehicle,
                vehicleHash,
                vehicleModel,
                primarycolor || 0
            );

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
                    name: "model/all/full",
                    help: "The vehicle model, 'all' to screenshot all vehicles, or 'full' to screenshot all vehicles with all color combinations",
                },
                {
                    name: "primarycolor",
                    help: "The primary vehicle color to take a screenshot of (optional) See: https://wiki.rage.mp/index.php?title=Vehicle_Colors",
                },
                {
                    name: "secondarycolor",
                    help: "The secondary vehicle color to take a screenshot of (optional) See: https://wiki.rage.mp/index.php?title=Vehicle_Colors",
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
