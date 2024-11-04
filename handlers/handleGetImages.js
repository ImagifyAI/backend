export default async function handleGetImages(request, env, userId) {
    try {
        const { results } = await env.MY_DB.prepare(
            `SELECT id, filename, upload_date, tags FROM images WHERE user_id = ? ORDER BY upload_date DESC`
        ).bind(userId).all();

        return new Response(JSON.stringify({ success: true, images: results }), {
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
