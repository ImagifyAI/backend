import jwt from "jsonwebtoken";

export async function handleAuth(request, env) {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return { isAuthenticated: false };
	}

	const token = authHeader.slice(7);

	try {
		const decodedToken = jwt.verify(token, env.JWT_SECRET);
		return { isAuthenticated: true, userId: decodedToken.sub };
	} catch (error) {
		console.error("Invalid token:", error);
		return { isAuthenticated: false };
	}
}

