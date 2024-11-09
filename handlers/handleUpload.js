import { handleTagging } from "../handlers/handleTagging";

export default async function handleUpload(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    let userId, imageData;

    try {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            userId = formData.get("userId");   
            imageData = formData.get("image");

            if (typeof userId === "string") {
                userId = parseInt(userId, 10);  
            }

            if (!imageData) {
                throw new Error("Image data missing in the request");
            }
        } else {
            const jsonData = await request.json();
            userId = jsonData.userId;
            imageData = jsonData.imageData;
        }
    } catch (error) {
        console.error("Error parsing upload request:", error);
        return new Response("Invalid upload request", { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;

    try {
        const arrayBuffer = await imageData.arrayBuffer();
        const base64Image = arrayBufferToBase64(arrayBuffer);

        await env.IMAGES_BUCKET.put(filename, imageData);

        const tags = await handleTagging(base64Image, env);

        await env.MY_DB.prepare(
            `INSERT INTO images (user_id, filename, tags, upload_date) VALUES (?, ?, ?, ?)`
        ).bind(userId, filename, JSON.stringify(tags), new Date(timestamp).toISOString()).run();

        return new Response(JSON.stringify({ success: true, filename, tags }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Image upload error:", error);
        return new Response("Image upload failed", { status: 500 });
    }
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 1024;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
