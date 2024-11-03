function decodeJWT(token) {
  const payload = token.split(".")[1];
  const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodedPayload);
}

export async function handleAuth(request) {
    const authHeader = request.headers.get("CF_Authorization");
    if (!authHeader) {
      return { isAuthenticated: false };
  }

  try {
      const decodedToken = decodeJWT(authHeader);
      const userId = decodedToken.sub || decodedToken.email; 
      return { isAuthenticated: true, userId };
  } catch (error) {
      console.error("Failed to decode Cloudflare Access token:", error);
      return { isAuthenticated: false };
  }
}
  