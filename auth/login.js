import { verifyPassword } from "../utils/password.js";
import { signJWT } from "../utils/jwt.js";

export default async function handleLogin(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    const turnstileResponse = request.headers.get('Turnstile-Token');
    if (!turnstileResponse) {
        return new Response(JSON.stringify({ success: false, error: "Turnstile token missing" }), { status: 400 });
    }

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
        return new Response(JSON.stringify({ success: false, error: "Email and password are required" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
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
