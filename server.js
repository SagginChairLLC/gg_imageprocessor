/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const imagejs = require("image-js");
const fs = require("fs");

const resName = GetCurrentResourceName();
const mainSavePath = `resources/${resName}/images`;

try {
    if (!fs.existsSync(mainSavePath)) {
        fs.mkdirSync(mainSavePath);
    }

    onNet("takeScreenshot", async (filename, type) => {
        const savePath = `${mainSavePath}/${type}`;
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }

        exports["screenshot-basic"].requestClientScreenshot(
            source,
            {
                fileName: savePath + "/" + filename + ".png",
                encoding: "png",
                quality: 1.0,
            },
            async (err, fileName) => {
                let image = await imagejs.Image.load(fileName);
                const { width, height } = image;
                let minX = width,
                    minY = height,
                    maxX = 0,
                    maxY = 0;

                // Detect vehicle bounds (exclude green/transparent background) with tolerance
                const greenTolerance = 30;
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const [r, g, b] = image.getPixelXY(x, y);

                        // Relaxed green detection
                        if (!(g > r + b + greenTolerance)) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                console.log(`Original image: ${width}x${height}`);
                console.log(
                    `Crop bounds: minX=${minX}, maxX=${maxX}, width=${
                        maxX - minX + 1
                    }`
                );
                console.log(
                    `Crop bounds: minY=${minY}, maxY=${maxY}, height=${
                        maxY - minY + 1
                    }`
                );

                // Safety check to avoid invalid crop
                if (minX >= maxX || minY >= maxY) {
                    console.warn("No vehicle pixels detected for:", fileName);
                    return;
                }

                // Perform crop
                const croppedImage = image.crop({
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                });

                console.log(
                    `Cropped image size: ${croppedImage.width}x${croppedImage.height}`
                );

                // Convert green to transparent
                for (let y = 0; y < croppedImage.height; y++) {
                    for (let x = 0; x < croppedImage.width; x++) {
                        const [r, g, b] = croppedImage.getPixelXY(x, y);
                        if (g > r + b + greenTolerance) {
                            croppedImage.setPixelXY(x, y, [255, 255, 255, 0]);
                        }
                    }
                }

                await croppedImage.save(fileName);
                console.log("Saved:", fileName);
            }
        );
    });
} catch (error) {
    console.error(error.message);
}
