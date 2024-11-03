export async function handleAuth(request) {
  const userEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!userEmail) {
    return { isAuthenticated: false };
  }

  return { 
    isAuthenticated: true,
    userId: userEmail
  };
}