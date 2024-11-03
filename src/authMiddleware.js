function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      throw new Error('Invalid token format');
    }
    const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    throw error;
  }
}

export async function handleAuth(request) {
  try {
    const cfAccessEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
    const cfAccessUserId = request.headers.get("Cf-Access-Authenticated-User-Id");

    if (!cfAccessEmail || !cfAccessUserId) {
      console.log('Missing Cloudflare Access headers');
      return { isAuthenticated: false };
    }

    return { 
      isAuthenticated: true, 
      userId: cfAccessUserId,
      email: cfAccessEmail
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { isAuthenticated: false };
  }
}