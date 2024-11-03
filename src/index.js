/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleAuth } from "./authMiddleware";

const corsHeaders = {
	"Access-Control-Allow-Origin": "https://images.lokesh.cloud",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Allow-Credentials": "true",
	"Access-Control-Max-Age": "86400",
};

export default {
	async fetch(request, env) {
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			const url = new URL(request.url);

			if (url.pathname.startsWith('/images/')) {
				const filename = url.pathname.replace('/images/', '');
				const object = await env.IMAGES_BUCKET.get(filename);

				if (object === null) {
					return new Response('Image not found', {
						status: 404,
						headers: corsHeaders
					});
				}

				const headers = new Headers();
				headers.set('Content-Type', object.httpMetadata.contentType);
				headers.set('Cache-Control', 'public, max-age=31536000');
				Object.entries(corsHeaders).forEach(([key, value]) => {
					headers.set(key, value);
				});

				return new Response(object.body, { headers });
			}

			const authResult = await handleAuth(request);
			console.log('Auth result:', {
				isAuthenticated: authResult.isAuthenticated,
				hasUserId: !!authResult.userId
			});

			if (!authResult.isAuthenticated) {
				console.log('Authentication failed');
				return new Response("Unauthorized", {
					status: 401,
					headers: corsHeaders
				});
			}

			let response;
			switch (url.pathname) {
				case "/api/upload":
					response = await handleUpload(request, env, authResult.userId);
					break;
				case "/api/images":
					response = await handleGetImages(request, env, authResult.userId);
					break;
				default:
					response = new Response("Not Found", { status: 404 });
			}

			const newHeaders = new Headers(response.headers);
			Object.entries(corsHeaders).forEach(([key, value]) => {
				newHeaders.set(key, value);
			});

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: newHeaders,
			});

		} catch (error) {
			console.error('Error:', error);
			return new Response("Internal Server Error", {
				status: 500,
				headers: corsHeaders
			});
		}
	}
};

async function handleUpload(request, env, userId) {
	if (request.method !== 'POST') {
		return new Response("Method not allowed", { status: 405 });
	}

	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
		return new Response("Unsupported media type", { status: 415 });
	}

	const image = await request.arrayBuffer();
	const timestamp = Date.now();
	const uniqueFilename = `${userId}_${timestamp}.jpg`;
	const imageId = `${userId}_${timestamp}`;

	await env.IMAGES_BUCKET.put(uniqueFilename, image, {
		httpMetadata: { contentType },
	});

	await env.MY_DB.prepare(
		`INSERT INTO images (id, user_id, filename, upload_date, tags) VALUES (?, ?, ?, ?, ?)`
	)
		.bind(imageId, userId, uniqueFilename, new Date(timestamp).toISOString(), "")
		.run();

	return new Response(JSON.stringify({ success: true, filename: uniqueFilename, id: imageId }), {
		headers: { "Content-Type": "application/json" },
	});
}

async function handleGetImages(request, env, userId) {
	const { results } = await env.MY_DB.prepare(
		`SELECT id, filename, upload_date, tags FROM images WHERE user_id = ? ORDER BY upload_date DESC`
	)
		.bind(userId)
		.all();

	return new Response(JSON.stringify({ success: true, images: results }), {
		headers: { "Content-Type": "application/json" },
	});
}