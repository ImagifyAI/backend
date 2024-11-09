import { handleTagging } from "../handlers/handleTagging";

export default async function handleUpload(request, env) {
    if (request.method !== 'POST') {
        return setCORSHeaders(new Response("Method not allowed", { status: 405 }));
    }

    const { userId, imageData } = await request.json();
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;

    try {
        await env.IMAGES_BUCKET.put(filename, imageData);

        const tags = await handleTagging(imageData, env);

        await env.MY_DB.prepare(
            `INSERT INTO images (user_id, filename, tags, upload_date) VALUES (?, ?, ?, ?)`
        ).bind(userId, filename, JSON.stringify(tags), new Date(timestamp)).run();

        return setCORSHeaders(new Response(JSON.stringify({ success: true, filename, tags }), {
            headers: { "Content-Type": "application/json" },
        }));
    } catch (error) {
        console.error("Image upload error:", error);
        return setCORSHeaders(new Response("Image upload failed", { status: 500 }));
    }
}
