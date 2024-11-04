export default async function handleUpload(request, env, userId) {
	if (request.method !== 'POST') {
		return new Response("Method not allowed", { status: 405 });
	}

	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
		return new Response("Unsupported media type", { status: 415 });
	}

	const image = await request.arrayBuffer();
	const timestamp = Date.now();
	const uniqueFilename = `${userId}_${timestamp}.jpg`;
	const imageId = `${userId}_${timestamp}`;

	await env.IMAGES_BUCKET.put(uniqueFilename, image, {
		httpMetadata: { contentType },
	});

	await env.MY_DB.prepare(
		`INSERT INTO images (id, user_id, filename, upload_date, tags) VALUES (?, ?, ?, ?, ?)`
	).bind(imageId, userId, uniqueFilename, new Date(timestamp).toISOString(), "")
	.run();

	return new Response(JSON.stringify({ success: true, filename: uniqueFilename, id: imageId }), {
		headers: { "Content-Type": "application/json" },
	});
}
