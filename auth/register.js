async function verifyTurnstileToken(token, ip, secret) {
    try {
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
        console.log("Turnstile verification response:", data);
        return data.success;
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return false;
    }
}

export default async function handleRegister(request, env) {
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const { email, password, turnstileToken } = await request.json();
        
        if (!email || !password) {
            return new Response("Email and password are required", { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!turnstileToken) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Turnstile verification required" 
            }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const clientIp = request.headers.get('cf-connecting-ip');
        const isValid = await verifyTurnstileToken(
            turnstileToken, 
            clientIp, 
            env.TURNSTILE_SECRET_KEY
        );
        
        if (!isValid) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Invalid security challenge response" 
            }), { 
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { hash, salt } = await hashPassword(password);

        await env.MY_DB.prepare(
            `INSERT INTO users (email, password, salt) VALUES (?, ?, ?)`
        ).bind(email, hash, salt).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Registration error:", error);
        
        if (error.message?.includes("UNIQUE constraint failed")) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Email already registered" 
            }), { 
                status: 409,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ 
            success: false, 
            error: "Registration failed" 
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}