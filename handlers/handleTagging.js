export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        if (!(imageData instanceof Blob)) {
            const arrayBuffer = await imageData.arrayBuffer();
            imageData = new Blob([arrayBuffer], { type: 'image/jpeg' });
            console.log("Converted imageData to Blob:", imageData);
        }

        const response = await env.AI.run(modelId, {
            image: imageData, 
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
