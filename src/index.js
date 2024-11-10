import { handleAuth } from "../auth/authMiddleware.js";
import handleRegister from "../auth/register.js";
import handleLogin from "../auth/login.js";
import handleUpload from "../handlers/handleUpload.js";
import handleGetImages from "../handlers/handleGetImages.js";
import handleCart from "../handlers/handleCart.js";
import handleSearch from "../handlers/handleSearch.js";

function setCORSHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "https://images.lokesh.cloud");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
    });
}

function handleOptions(request) {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "https://images.lokesh.cloud");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", "86400");

    return new Response(null, { headers });
}

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

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return handleOptions(request);
        }

        let response;

        try {
            let requestData = {};
            if (url.pathname === "/api/search" && request.method === "POST") {
                const contentType = request.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    requestData = await request.json();
                } else if (contentType.includes("multipart/form-data")) {
                    const formData = await request.formData();
                    requestData = Object.fromEntries(formData.entries());
                }
            }

            switch (url.pathname) {
                case "/api/register":
                    {
                        const clientIp = request.headers.get('cf-connecting-ip');
                        const body = await request.json();
                        
                        if (!body.turnstileToken) {
                            response = new Response(JSON.stringify({ 
                                success: false, 
                                error: "Security verification required" 
                            }), { 
                                status: 400,
                                headers: { "Content-Type": "application/json" }
                            });
                            break;
                        }

                        const isValid = await verifyTurnstileToken(
                            body.turnstileToken, 
                            clientIp, 
                            env.TURNSTILE_SECRET_KEY
                        );

                        if (!isValid) {
                            response = new Response(JSON.stringify({ 
                                success: false, 
                                error: "Invalid security verification" 
                            }), { 
                                status: 403,
                                headers: { "Content-Type": "application/json" }
                            });
                            break;
                        }

                        const newRequest = new Request(request.url, {
                            method: request.method,
                            headers: request.headers,
                            body: JSON.stringify({
                                email: body.email,
                                password: body.password
                            })
                        });
                        
                        response = await handleRegister(newRequest, env);
                    }
                    break;

                case "/api/login":
                    {
                        const clientIp = request.headers.get('cf-connecting-ip');
                        const body = await request.json();
                        
                        // Verify Turnstile first
                        if (!body.turnstileToken) {
                            response = new Response(JSON.stringify({ 
                                success: false, 
                                error: "Security verification required" 
                            }), { 
                                status: 400,
                                headers: { "Content-Type": "application/json" }
                            });
                            break;
                        }

                        const isValid = await verifyTurnstileToken(
                            body.turnstileToken, 
                            clientIp, 
                            env.TURNSTILE_SECRET_KEY
                        );

                        if (!isValid) {
                            response = new Response(JSON.stringify({ 
                                success: false, 
                                error: "Invalid security verification" 
                            }), { 
                                status: 403,
                                headers: { "Content-Type": "application/json" }
                            });
                            break;
                        }

                        const newRequest = new Request(request.url, {
                            method: request.method,
                            headers: request.headers,
                            body: JSON.stringify({
                                email: body.email,
                                password: body.password
                            })
                        });
                        
                        response = await handleLogin(newRequest, env);
                    }
                    break;

                case "/api/upload":
                    const authResultUpload = await handleAuth(request, env);
                    if (!authResultUpload.isAuthenticated) {
                        response = new Response("Unauthorized", { status: 401 });
                    } else {
                        response = await handleUpload(request, env, authResultUpload.userId);
                    }
                    break;
                case "/api/images":
                    const authResultImages = await handleAuth(request, env);
                    if (!authResultImages.isAuthenticated) {
                        response = new Response("Unauthorized", { status: 401 });
                    } else {
                        response = await handleGetImages(request, env, authResultImages.userId);
                    }
                    break;
                case "/api/search":
                    const authResultSearch = await handleAuth(request, env);
                    if (!authResultSearch.isAuthenticated) {
                        response = new Response("Unauthorized", { status: 401 });
                    } else {
                        response = await handleSearch(request, env, authResultSearch.userId, requestData.query);
                    }
                    break;
                case "/api/cart":
                    const authResultCart = await handleAuth(request, env);
                    if (!authResultCart.isAuthenticated) {
                        response = new Response("Unauthorized", { status: 401 });
                    } else {
                        response = await handleCart(request, env, authResultCart.userId);
                    }
                    break;
                default:
                    response = new Response("Not Found", { status: 404 });
            }
        } catch (error) {
            console.error("Unhandled error:", error);
            response = new Response(JSON.stringify({ 
                success: false, 
                error: "Internal Server Error" 
            }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        return setCORSHeaders(response);
    }
};