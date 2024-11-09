export default async function handleSearch(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    const { userId, query } = await request.json();

    try {
        const result = await env.MY_DB.prepare(
            `SELECT * FROM images WHERE user_id = ? AND tags LIKE ?`
        ).bind(userId, `%${query}%`).all();

        return new Response(JSON.stringify({ success: true, images: result.results }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Search error:", error);
        return new Response("Search failed", { status: 500 });
    }
}
