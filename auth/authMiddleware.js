import { verifyJWT } from "../utils/jwt.js";

export async function handleAuth(request, env) {
    const authHeader = request.headers.get("Authorization");
    console.log("Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("Authorization header is missing or malformed");
        return { isAuthenticated: false };
    }

    const token = authHeader.slice(7);
    
    const decodedToken = await verifyJWT(token, env.JWT_SECRET);
    if (!decodedToken) {
        console.error("Token verification failed or token is expired");
        return { isAuthenticated: false };
    }

    console.log("Decoded Token:", decodedToken);
    return { isAuthenticated: true, userId: decodedToken.sub };
}
