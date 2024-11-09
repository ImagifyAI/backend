import { hashPassword } from "../utils/password.js";

export default async function handleRegister(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    const turnstileResponse = request.headers.get('Turnstile-Token');
    if (!turnstileResponse) {
        return new Response(JSON.stringify({ success: false, error: "Turnstile token missing" }), { status: 400 });
    }
    console.log("Turnstile token:", turnstileResponse);
    console.log("TURNSTILE_SECRET:", env.TURNSTILE_SECRET);

    const turnstileVerifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: turnstileResponse })
    });
    const turnstileResult = await turnstileVerifyResponse.json();

    if (!turnstileResult.success) {
        return new Response(JSON.stringify({ success: false, error: "Turnstile verification failed" }), { status: 403 });
    }

    const { email, password } = await request.json();
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
