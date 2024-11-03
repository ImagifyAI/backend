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


export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
				},
			});
		}		

		const authResult = await handleAuth(request);
		if (!authResult.isAuthenticated) {
			return new Response("Unauthorized", { status: 401 });
		}
		
		switch (url.pathname) {
			case "/api/upload":
				return handleUpload(request, env, authResult.userId);
			case "/api/images":
				return handleGetImages(request, env, authResult.userId);
			case url.pathname.startsWith("/api/image/"):
				const filename = url.pathname.split("/api/image/")[1];
				return handleGetImage(filename, env);			
			case "/api/cart":
				return handleCart(request, env, authResult.userId);
			default:
				return new Response("Not Found", { status: 404 });
		}
	}
};

async function handleUpload(request, env, userId) {
	if (request.method !== 'POST') {
	  return new Response("Method not allowed", { 
	  	status: 405,
	  	headers: {
	  		"Access-Control-Allow-Origin": "*",
	  	}
	  });
	}
  
	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
		return new Response("Unsupported media type", { 
			status: 415,
			headers: {
				"Access-Control-Allow-Origin": "*",
			}
		});
	  }
  
	const image = await request.arrayBuffer();
	const timestamp = Date.now();
	const uniqueFilename = `${userId}_${timestamp}.jpg`;

	const imageId = `${userId}_${timestamp}`;
	await env.IMAGES_BUCKET.put(uniqueFilename, image, {
		httpMetadata: { contentType },
	  });
 
	await env.MY_DB.prepare(
		`INSERT INTO images (id, user_id, filename, upload_date) VALUES (?, ?, ?, ?)`
	  )
	  	.bind(imageId, userId, uniqueFilename, new Date(timestamp).toISOString())
		.run();

	return new Response(JSON.stringify({ success: true, filename: uniqueFilename, id: imageId }), {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
  }

async function handleGetImages(request, env, userId) {
	const { results } = await env.MY_DB.prepare(
		`SELECT id, filename, upload_date FROM images WHERE user_id = ? ORDER BY upload_date DESC`
	  )
		.bind(userId)
		.all();
	
	  return new Response(JSON.stringify({ success: true, images: results }), {
		headers: { "Content-Type": "application/json" },
	  });
}

async function handleGetImage(filename, env) {
	const image = await env.IMAGES_BUCKET.get(filename);
	if (!image) {
	  return new Response("Image not found", { status: 404 });
	}
  
	return new Response(image.body, {
	  headers: {
		"Content-Type": image.httpMetadata.contentType || "image/jpeg",
	  },
	});
  }

async function handleCart(request) {
	return new Response("Cart endpoint", { status: 200 });
}
