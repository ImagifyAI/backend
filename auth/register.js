import { hashPassword } from "../utils/password.js";

async function verifyTurnstileToken(token, ip, secret) {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            secret: secret,
            response: token,
            remoteip: ip
        })
    });

    const data = await response.json();
    return data.success;
}

export default async function handleRegister(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    const { email, password, turnstileToken } = await request.json();
    if (!email || !password || !turnstileToken) {
        return new Response("Email, password, and turnstile verification are required", { status: 400 });
    }

    const clientIp = request.headers.get('cf-connecting-ip');
    const isValid = await verifyTurnstileToken(turnstileToken, clientIp, env.TURNSTILE_SECRET_KEY);
    
    if (!isValid) {
        return new Response("Invalid turnstile token", { status: 403 });
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