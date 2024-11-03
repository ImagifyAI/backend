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
  const authHeader = request.headers.get("Authorization");
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('Missing or invalid auth header');
    return { isAuthenticated: false };
  }

  const token = authHeader.slice(7);
  console.log('Token length:', token?.length);

  try {
    const decodedToken = decodeJWT(token);
    console.log('Decoded token:', {
      sub: decodedToken.sub,
      email: decodedToken.email,
    });
    
    const userId = decodedToken.sub || decodedToken.email;
    if (!userId) {
      console.log('No userId found in token');
      return { isAuthenticated: false };
    }
    
    return { isAuthenticated: true, userId };
  } catch (error) {
    console.error("Failed to decode token:", error);
    return { isAuthenticated: false };
  }
}