export default async function handleGetImages(request, env, userId) {
	const result = await env.MY_DB.prepare(
		`SELECT id, filename, upload_date, tags FROM images WHERE user_id = ? ORDER BY upload_date DESC`
	).bind(userId).all();

	return new Response(JSON.stringify({ success: true, images: result }), {
		headers: { "Content-Type": "application/json" },
	});
}
