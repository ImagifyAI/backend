import { handleTagging } from "../handlers/handleTagging";

export default async function handleUpload(request, env) {
    if (request.method !== 'POST') {
        return setCORSHeaders(new Response("Method not allowed", { status: 405 }));
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
        return setCORSHeaders(new Response("Invalid upload request", { status: 400 }));
    }

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
