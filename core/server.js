/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const imagejs = require("image-js");
const fs = require("fs");

const resName = GetCurrentResourceName();
const mainSavePath = `${GetResourcePath(resName)}/images`;

try {
    if (!fs.existsSync(mainSavePath)) {
        fs.mkdirSync(mainSavePath);
    }

    onNet("takeScreenshot", async (vehicleId) => {
        const playerId = source;
        const finalFilePath = `${mainSavePath}/${vehicleId}.png`;
        try {
            await new Promise((resolve, reject) => {
                exports["screenshot-basic"].requestClientScreenshot(
                    playerId,
                    {
                        fileName: finalFilePath,
                        encoding: "png",
                        quality: 1.0,
                        channels: 4,
                        isAlpha: true,
                    },
                    async (err, fileName) => {
                        if (err) {
                            console.error(
                                `Screenshot error for ${vehicleId}:`,
                                err
                            );
                            emitNet("screenshotComplete", playerId, false);
                            reject(err);
                            return;
                        }

                        try {
                            let image = await imagejs.Image.load(fileName);
                            if (image.channels < 4) {
                                image = image.rgba8();
                            }

                            const { width, height } = image;
                            let minX = width,
                                minY = height,
                                maxX = 0,
                                maxY = 0;

                            const greenTolerance = 100;

                            for (let y = 0; y < height; y++) {
                                for (let x = 0; x < width; x++) {
                                    const [r, g, b] = image.getPixelXY(x, y);
                                    if (!(g > r + b + greenTolerance)) {
                                        if (x < minX) minX = x;
                                        if (x > maxX) maxX = x;
                                        if (y < minY) minY = y;
                                        if (y > maxY) maxY = y;
                                    }
                                }
                            }

                            if (minX >= maxX || minY >= maxY) {
                                console.warn(
                                    `No vehicle pixels detected for: ${vehicleId}`
                                );
                                emitNet("screenshotComplete", playerId, false);
                                resolve();
                                return;
                            }

                            const croppedImage = image.crop({
                                x: minX,
                                y: minY,
                                width: maxX - minX + 1,
                                height: maxY - minY + 1,
                            });

                            const softRange = 40;
                            for (let y = 0; y < croppedImage.height; y++) {
                                for (let x = 0; x < croppedImage.width; x++) {
                                    let [r, g, b, a = 255] =
                                        croppedImage.getPixelXY(x, y);

                                    r = r > 1 ? r : r * 255;
                                    g = g > 1 ? g : g * 255;
                                    b = b > 1 ? b : b * 255;

                                    const hardCut = r + b + greenTolerance;
                                    const softCut = hardCut - softRange;

                                    if (g > hardCut) {
                                        croppedImage.setPixelXY(
                                            x,
                                            y,
                                            [0, 0, 0, 0]
                                        );
                                    } else if (g > softCut) {
                                        const alpha = Math.max(
                                            0,
                                            255 -
                                                ((g - softCut) /
                                                    (hardCut - softCut)) *
                                                    255
                                        );
                                        croppedImage.setPixelXY(x, y, [
                                            r,
                                            g,
                                            b,
                                            alpha,
                                        ]);
                                    } else {
                                        croppedImage.setPixelXY(x, y, [
                                            r,
                                            g,
                                            b,
                                            255,
                                        ]);
                                    }
                                }
                            }

                            await croppedImage.save(fileName);
                            emitNet("screenshotComplete", playerId, true);
                            resolve();
                        } catch (processingError) {
                            console.error(
                                `Image processing error for ${vehicleId}:`,
                                processingError
                            );
                            emitNet("screenshotComplete", playerId, false);
                            reject(processingError);
                        }
                    }
                );
            });
        } catch (error) {
            console.error(`Screenshot failed for ${vehicleId}:`, error);
            emitNet("screenshotComplete", playerId, false);
        }
    });
} catch (error) {
    console.error("Server initialization error:", error.message);
}
