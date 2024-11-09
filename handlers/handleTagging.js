export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        if (!imageData || typeof imageData !== "string") {
            throw new Error("Invalid image data. Base64 string expected.");
        }

        console.log("Image data size:", imageData.length, "characters");

        const imageBlob = base64ToBlob(imageData, 'image/jpeg');

        const response = await env.AI.run(modelId, {
            image: imageBlob,
            stream: false
        });

        if (!response || response.error) {
            throw new Error("Failed to generate tags from Workers AI");
        }

        const tags = response.caption ? response.caption.split(' ') : [];
        return tags;
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}

function base64ToBlob(base64, type = 'application/octet-stream') {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: type });
}
