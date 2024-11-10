import { verifyPassword } from "../utils/password.js";
import { signJWT } from "../utils/jwt.js";

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

export default async function handleLogin(request, env) {
    const { email, password, turnstileToken } = await request.json();
    const isHuman = await verifyTurnstile(turnstileToken, env);
    if (!isHuman) {
        return new Response("Turnstile verification failed", { status: 403 });
    }
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    if (!email || !password) {
        return new Response(JSON.stringify({ success: false, error: "Email and password are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const result = await env.MY_DB.prepare(
        `SELECT id, password, salt FROM users WHERE email = ?`
    ).bind(email).first();

    if (!result || !(await verifyPassword(password, result.password, result.salt))) {
        return new Response(JSON.stringify({ success: false, error: "Invalid email or password" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const token = await signJWT({ sub: result.id, email }, env.JWT_SECRET, '1h');

    return new Response(JSON.stringify({ success: true, token }), {
        headers: { "Content-Type": "application/json" },
    });
}
