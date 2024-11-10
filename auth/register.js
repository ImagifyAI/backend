import { hashPassword } from "../utils/password.js";

async function verifyTurnstile(token, env) {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: token,
        }),
    });
    const data = await response.json();
    console.log("Cloudflare Verification Response:", data);
    return data.success;
}

export default async function handleRegister(request, env) {
    const { email, password, turnstileToken } = await request.json();
    const isHuman = await verifyTurnstile(turnstileToken, env);
    if (!isHuman) {
        return new Response("Turnstile verification failed", { status: 403 });
    }
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    if (!email || !password) {
        return new Response("Email and password are required", { status: 400 });
    }

    const { hash, salt } = await hashPassword(password);

    try {
        await env.MY_DB.prepare(
            `INSERT INTO users (email, password, salt) VALUES (?, ?, ?)`
        ).bind(email, hash, salt).run();
    } catch (error) {
        console.error("Registration error:", error);
        return new Response("Email already registered", { status: 409 });
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
    });
}
