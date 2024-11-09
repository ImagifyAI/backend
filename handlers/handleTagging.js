export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        if (imageData instanceof File || imageData instanceof Blob) {
            const buffer = await imageData.arrayBuffer();
            console.log("Image data size:", buffer.byteLength, "bytes");

            const base64Image = arrayBufferToBase64(buffer);

            const response = await env.AI.run(modelId, {
                image: base64Image,  
                stream: false
            });

            if (!response || response.error) {
                throw new Error("Failed to generate tags from Workers AI");
            }

            const tags = response.caption ? response.caption.split(' ') : [];
            return tags;
        } else {
            throw new Error("Provided image data is not a valid File or Blob");
        }
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
}
