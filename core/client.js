/// <reference types="@citizenfx/client" />

const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

let cam;
const playerId = PlayerId();
let currentCallback = null;

async function setupCameraSystem() {
    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        cam = null;
    }
    const camCoords = {
        x: -1324.13,
        y: -2257.61,
        z: 50.77,
    };

    cam = CreateCamWithParams(
        "DEFAULT_SCRIPTED_CAMERA",
        camCoords.x,
        camCoords.y,
        camCoords.z,
        0,
        0,
        0,
        50.0,
        true,
        0
    );

    SetCamActive(cam, true);
    RenderScriptCams(true, false, 0, true, false, 0);

    await Delay(200);

    return true;
}

async function adjustCameraForVehicle(vehicle, hash) {
    if (!cam) {
        console.error("Camera not initialized");
        return false;
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

    SetCamCoord(cam, camPos.x, camPos.y, camPos.z + 0.5);
    SetCamFov(cam, fov);
    PointCamAtCoord(cam, center.x, center.y, center.z);

    await Delay(100);

    return true;
}

async function takeScreenshotForVehicle(vehicleId) {
    return new Promise((resolve) => {
        currentCallback = resolve;
        emitNet("takeScreenshot", vehicleId);
    });
}

onNet("screenshotComplete", (success) => {
    if (currentCallback) {
        currentCallback(success);
        currentCallback = null;
    }
});

onNet("gg_imageprocessor:client:setupCamera", async (data) => {
    const { onReady } = data;

    try {
        const success = await setupCameraSystem();
        if (onReady) {
            onReady(success);
        }
    } catch (error) {
        console.error("Error setting up camera:", error);
        if (onReady) {
            onReady(false);
        }
    }
});

onNet("gg_imageprocessor:client:takeVehicleScreenshot", async (data) => {
    const { vehicle, hash, vehicleId, onComplete } = data;

    if (!vehicle || !DoesEntityExist(vehicle)) {
        console.log("ERROR: Invalid vehicle entity");
        if (onComplete) onComplete(false);
        return;
    }

    if (!cam) {
        console.log("ERROR: Camera not initialized");
        if (onComplete) onComplete(false);
        return;
    }

    try {
        await adjustCameraForVehicle(vehicle, hash);
        const success = await takeScreenshotForVehicle(vehicleId);
        if (onComplete) {
            onComplete(success);
        }
    } catch (error) {
        console.error("Error taking vehicle screenshot:", error);
        if (onComplete) {
            onComplete(false);
        }
    }
});

onNet("gg_imageprocessor:client:stopVehicleCamera", () => {
    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        RenderScriptCams(false, false, 0, true, false, 0);
        cam = null;
    }

    SetPlayerControl(playerId, true);
    currentCallback = null;
});

onNet("gg_imageprocessor:client:resetCameraSystem", () => {
    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        RenderScriptCams(false, false, 0, true, false, 0);
        cam = null;
    }

    SetPlayerControl(playerId, true);
    currentCallback = null;
});

on("onResourceStop", (resName) => {
    if (GetCurrentResourceName() != resName) return;

    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        RenderScriptCams(false, false, 0, true, false, 0);
        cam = null;
    }

    SetPlayerControl(playerId, true);
    currentCallback = null;
});
