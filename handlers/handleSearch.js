function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default async function handleSearch(request, env, userId, query) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    if (!userId || !query) {
        return new Response("User ID or query missing", { status: 400 });
    }

    try {
        console.log("Executing search with userId:", userId, "query:", query);

        const result = await env.MY_DB.prepare(
            `SELECT * FROM images WHERE user_id = ? AND tags LIKE ?`
        ).bind(userId, `%${query}%`).all();

        if (!result.results || result.results.length === 0) {
            console.error("No search results found for query:", query);
            return new Response(JSON.stringify({ success: false, error: "No images found matching the query" }), {
                headers: { "Content-Type": "application/json" },
                status: 404,
            });
        }

        console.log("Search results:", result.results);

        const imagesWithData = await Promise.all(result.results.map(async (image) => {
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

        console.log("Images with data prepared for search response");

        return new Response(JSON.stringify({ success: true, images: imagesWithData }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Search error:", error.message);
        return new Response("Search failed due to internal error", { status: 500 });
    }
}
