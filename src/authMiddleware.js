export async function handleAuth(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isAuthenticated: false };
    }
  
    const token = authHeader.slice(7);
  
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload && payload.sub) {
        return { isAuthenticated: true, user: payload.sub };
      }
    } catch (e) {
      console.error("Failed to parse token:", e);
    }
  
    return { isAuthenticated: false };
  }
  