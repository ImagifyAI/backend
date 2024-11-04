/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleAuth } from "../auth/authMiddleware.js";
import handleRegister from "../auth/register.js";
import handleLogin from "../auth/login.js";
import handleUpload from "../handlers/handleUpload.js";
import handleGetImages from "../handlers/handleGetImages.js";
import handleCart from "../handlers/handleCart.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		switch (url.pathname) {
			case "/api/register":
				return handleRegister(request, env);
			case "/api/login":
				return handleLogin(request, env);
			case "/api/upload":
			case "/api/images":
			case "/api/cart":
				const authResult = await handleAuth(request, env);
				if (!authResult.isAuthenticated) {
					return new Response("Unauthorized", { status: 401 });
				}
				if (url.pathname === "/api/upload") {
					return handleUpload(request, env, authResult.userId);
				} else if (url.pathname === "/api/images") {
					return handleGetImages(request, env, authResult.userId);
				} else {
					return handleCart(request, env, authResult.userId);
				}
			default:
				return new Response("Not Found", { status: 404 });
		}
	}
};
