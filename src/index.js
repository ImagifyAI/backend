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
	async fetch(request) {
		const url = new URL(request.url);

		const authResult = await handleAuth(request);
		if (!authResult.isAuthenticated) {
			return new Response("Unauthorized", { status: 401 });
		}

		switch (url.pathname) {
			case "/api/upload":
				return handleUpload(request);
			case "/api/images":
				return handleGetImages(request);
			case "/api/cart":
				return handleCart(request);
			default:
				return new Response("Not Found", { status: 404 });
		}
	}
};

async function handleUpload(request) {
	if (request.method !== 'POST') {
	  return new Response("Method not allowed", { status: 405 });
	}
  
	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
	  return new Response("Unsupported media type", { status: 415 });
	}
  
	const image = await request.arrayBuffer();
  
	const uniqueFilename = `image_${Date.now()}.jpg`;
  
	const bucket = IMAGES_BUCKET; 
	await bucket.put(uniqueFilename, image, {
	  httpMetadata: { contentType },
	});
  
	return new Response(JSON.stringify({ success: true, filename: uniqueFilename }), {
	  headers: { "Content-Type": "application/json" },
	});
  }

async function handleGetImages(request) {
	return new Response("Get images endpoint", { status: 200 });
}

async function handleCart(request) {
	return new Response("Cart endpoint", { status: 200 });
}
