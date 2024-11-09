export async function handleTagging(imageData, env) {
    const modelId = '@cf/microsoft/resnet-50';

    try {
        if (imageData instanceof File || imageData instanceof Blob) {
            const buffer = await imageData.arrayBuffer();
            const byteArray = new Uint8Array(buffer);

            const response = await env.AI.run(modelId, {
                image: [...byteArray],
                stream: false
            });

            console.log("AI Model Full Response:", response);

            const confidenceThreshold = 0.1;
            const tags = response
                .filter(item => item.score >= confidenceThreshold)
                .map(item => item.label);

            return tags;
        } else {
            throw new Error("Provided image data is not a valid File or Blob");
        }
    } catch (error) {
        console.error("AI Tagging Error:", error);
        return [];
    }
}
