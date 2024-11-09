export async function handleTagging(imageData, env) {
    const modelId = '@cf/unum/uform-gen2-qwen-500m';

    try {
        if (imageData instanceof File || imageData instanceof Blob) {
            const buffer = await imageData.arrayBuffer();
            const imageBlob = new Blob([buffer], { type: 'image/jpeg' });

            const base64Image = await toBase64(imageBlob);

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

function toBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
