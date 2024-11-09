export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        if (!(imageData instanceof File)) {
            throw new Error("Image data is not a valid File object.");
        }

        const arrayBuffer = await imageData.arrayBuffer();
        console.log("Image data size:", arrayBuffer.byteLength, "bytes");

        const imageBlob = new Blob([arrayBuffer], { type: 'image/jpeg' });

        console.log("Blob size:", imageBlob.size, "bytes");

        const response = await env.AI.run(modelId, {
            image: imageBlob,  
            stream: false
        });

        if (!response || response.error) {
            throw new Error("Failed to generate tags from Workers AI: " + response?.error?.message || 'Unknown error');
        }

        const tags = response.caption ? response.caption.split(' ') : [];
        console.log("Generated tags:", tags);
        return tags;
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}
