export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw image
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    // As Base64 string
    // return canvas.toDataURL('image/jpeg');

    // As Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(file);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg');
    });
}

// Function to generate the final output with optional frame and circular crop
export async function getCroppedImgWithEffect(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    options: {
        frameColor?: string;
        isCircular?: boolean;
        rotation?: number;
    } = {}
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    if (options.isCircular) {
        ctx.beginPath();
        ctx.arc(
            pixelCrop.width / 2,
            pixelCrop.height / 2,
            Math.min(pixelCrop.width, pixelCrop.height) / 2,
            0,
            2 * Math.PI
        );
        ctx.clip();
    }

    // Draw the original image cropped
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Apply Frame if requested
    if (options.frameColor) {
        const borderThickness = Math.max(5, Math.min(pixelCrop.width, pixelCrop.height) * 0.01); // 2.5% thickness, min 5px
        ctx.lineWidth = borderThickness;
        ctx.strokeStyle = options.frameColor;

        if (options.isCircular) {
            ctx.beginPath();
            // Adjust radius to account for stroke width being centered
            ctx.arc(
                pixelCrop.width / 2,
                pixelCrop.height / 2,
                (Math.min(pixelCrop.width, pixelCrop.height) / 2) - (borderThickness / 2),
                0,
                2 * Math.PI
            );
            ctx.stroke();
        } else {
            // For square rect, stroke is centered on the path.
            // We want inner border usually, or centered.
            // Let's do inset frame.
            ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvas.width - borderThickness, canvas.height - borderThickness);
        }
    }

    const mimeType = options.isCircular ? 'image/png' : 'image/jpeg';

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(file);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, mimeType);
    });
}
