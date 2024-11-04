export default async function handleGetImages(request, env, userId) {
    try {
        const { results } = await env.MY_DB.prepare(
            `SELECT id, filename, upload_date, tags FROM images WHERE user_id = ? ORDER BY upload_date DESC`
        ).bind(userId).all();

        const imagesWithData = await Promise.all(results.map(async (image) => {
            const object = await env.IMAGES_BUCKET.get(image.filename);

            if (!object) {
                console.error(`Image not found in R2: ${image.filename}`);
                return { ...image, data: null };
            }

            const arrayBuffer = await object.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString("base64");
            const dataUri = `data:${object.httpMetadata.contentType || "image/jpeg"};base64,${base64Image}`;

            return { ...image, data: dataUri }; 
        }));

        return new Response(JSON.stringify({ success: true, images: imagesWithData }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching images:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch images" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
}
