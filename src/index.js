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
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
function createResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders
    },
  });
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return createResponse(null, 204);
		}		

		// const authResult = await handleAuth(request);
		const authResult = { isAuthenticated: true, userId: "test" };

		if (!authResult.isAuthenticated) {
			return createResponse("Unauthorized", 401);
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
				return createResponse("Not Found", 404);
		}
	}
};

async function handleUpload(request, env, userId) {
	if (request.method !== 'POST') {
		return createResponse("Method not allowed", 405);
	}
  
	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
		return createResponse("Unsupported media type", 415);
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

	return createResponse(
		JSON.stringify({ success: true, filename: uniqueFilename, id: imageId }), 
		200, 
		{ "Content-Type": "application/json" }
		);
	}

async function handleGetImages(request, env, userId) {
	const { results } = await env.MY_DB.prepare(
		`SELECT id, filename, upload_date FROM images WHERE user_id = ? ORDER BY upload_date DESC`
	  )
		.bind(userId)
		.all();
	
	return createResponse(
		JSON.stringify({ success: true, images: results }), 
		200, 
		{ "Content-Type": "application/json" }
		);
	}

async function handleGetImage(filename, env) {
	const image = await env.IMAGES_BUCKET.get(filename);
	if (!image) {
	  return createResponse("Image not found", 404);
	}
  
	return createResponse(
		image.body, 
		200, 
		{ "Content-Type": image.httpMetadata.contentType || "image/jpeg" }
	  );
	}

async function handleCart(request) {
	return createResponse("Cart endpoint", 200);
}
