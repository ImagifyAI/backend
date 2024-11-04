async function handleGetImage(request, env) {
    const url = new URL(request.url);
    const filename = url.pathname.split("/").pop();

    try {
        const object = await env.IMAGES_BUCKET.get(filename);

        if (!object) {
            return new Response("Image not found", { status: 404 });
        }

        return new Response(object.body, {
            headers: {
                "Content-Type": object.httpMetadata.contentType || "application/octet-stream",
                "Cache-Control": "public, max-age=31536000", 
            },
        });
    } catch (error) {
        console.error("Error fetching image:", error);
        return new Response("Failed to fetch image", { status: 500 });
    }
}