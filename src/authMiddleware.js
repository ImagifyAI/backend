function decodeJWT(token) {
  const payload = token.split(".")[1];
  const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodedPayload);
}

export async function handleAuth(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isAuthenticated: false };
    }
  
    const token = authHeader.slice(7);
  
    try {
      const decodedToken = decodeJWT(token);
      const userId = decodedToken.sub || decodedToken.email; 
      return { isAuthenticated: true, userId };
    } catch (error) {
      console.error("Failed to decode token:", error);
      return { isAuthenticated: false };
    }
  }
  