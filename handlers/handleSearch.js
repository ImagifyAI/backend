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

        console.log("Search results:", result);

        return new Response(JSON.stringify({ success: true, images: result.results }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Search error:", error.message);
        return new Response("Search failed due to internal error", { status: 500 });
    }
}
