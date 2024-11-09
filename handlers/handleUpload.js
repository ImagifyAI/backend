export default async function handleUpload(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    let userId, imageData;

    try {
        const contentType = request.headers.get("content-type") || "";
        console.log("Content-Type:", contentType);

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            console.log("Received form data keys:", Array.from(formData.keys()));

            userId = formData.get("userId");
            imageData = formData.get("image");

            if (typeof userId === "string") {
                userId = parseInt(userId, 10);
            }

            if (!imageData || !(imageData instanceof File)) {
                throw new Error("Image data missing or invalid in the request");
            }
        } else {
            const jsonData = await request.json();
            userId = jsonData.userId;
            imageData = jsonData.imageData;
        }

        console.log("Parsed userId:", userId);

        if (!userId) {
            throw new Error("User ID is missing");
        }

    } catch (error) {
        console.error("Error parsing upload request:", error);
        return new Response("Invalid upload request", { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;

    try {
        if (!(imageData instanceof File)) {
            throw new Error("Image data is not a valid File object.");
        }

        await env.IMAGES_BUCKET.put(filename, imageData);
        console.log("Image stored in bucket with filename:", filename);

        const tags = await handleTagging(imageData, env);
        console.log("Generated tags:", tags);

        await env.MY_DB.prepare(
            `INSERT INTO images (user_id, filename, tags, upload_date) VALUES (?, ?, ?, ?)`
        ).bind(userId, filename, JSON.stringify(tags), new Date(timestamp).toISOString()).run();

        console.log("Database entry created with userId:", userId, "filename:", filename, "tags:", tags);

        return new Response(JSON.stringify({ success: true, filename, tags }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Image upload error:", error);
        return new Response("Image upload failed", { status: 500 });
    }
}
