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
	return new Response("Upload endpoint", { status: 200 });
}

async function handleGetImages(request) {
	return new Response("Get images endpoint", { status: 200 });
}

async function handleCart(request) {
	return new Response("Cart endpoint", { status: 200 });
}
