function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default async function handleGetImages(request, env, userId) {
    try {
        console.log("Fetching images for userId:", userId);

        const { results } = await env.MY_DB.prepare(
            `SELECT id, filename, upload_date, tags FROM images WHERE user_id = ? ORDER BY upload_date DESC`
        ).bind(userId).all();

        if (!results) {
            console.error("No results found for the given user ID:", userId);
            return new Response(JSON.stringify({ success: false, error: "No images found for the user" }), {
                headers: { "Content-Type": "application/json" },
                status: 404,
            });
        }

        console.log("Database query results:", results);

        const imagesWithData = await Promise.all(results.map(async (image) => {
            const object = await env.IMAGES_BUCKET.get(image.filename);

            if (!object) {
                console.error(`Image not found in R2 for filename: ${image.filename}`);
                return { ...image, data: null };
            }

            const arrayBuffer = await object.arrayBuffer();
            const base64Image = arrayBufferToBase64(arrayBuffer); 
            const dataUri = `data:${object.httpMetadata.contentType || "image/jpeg"};base64,${base64Image}`;

            return { ...image, data: dataUri }; 
        }));

        console.log("Images with data prepared for response");

        return new Response(JSON.stringify({ success: true, images: imagesWithData }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching images:", error.message);
        console.error("Detailed stack trace:", error.stack);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
}
