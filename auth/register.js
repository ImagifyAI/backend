import { hashPassword } from "../utils/password.js";

export default async function handleRegister(request, env) {
    if (request.method !== 'POST') {
        return setCORSHeaders(new Response("Method not allowed", { status: 405 }));
    }

    const { email, password } = await request.json();
    if (!email || !password) {
        return setCORSHeaders(new Response("Email and password are required", { status: 400 }));
    }

    const { hash, salt } = await hashPassword(password);

    try {
        await env.MY_DB.prepare(
            `INSERT INTO users (email, password, salt) VALUES (?, ?, ?)`
        ).bind(email, hash, salt).run();
    } catch (error) {
        console.error("Registration error:", error);
        return setCORSHeaders(new Response("Email already registered", { status: 409 }));
    }

    return setCORSHeaders(new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
    }));
}
