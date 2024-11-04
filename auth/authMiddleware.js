import { verifyJWT } from "../utils/jwt.js";

export async function handleAuth(request, env) {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return { isAuthenticated: false };
	}

	const token = authHeader.slice(7);

	const decodedToken = await verifyJWT(token, env.JWT_SECRET);
	if (!decodedToken) {
		return { isAuthenticated: false };
	}

	return { isAuthenticated: true, userId: decodedToken.sub };
}
