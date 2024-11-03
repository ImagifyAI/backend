function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

export async function handleAuth(request) {
  const cookies = request.headers.get('Cookie');
  if (!cookies) {
    console.log('No cookies found');
    return { isAuthenticated: false };
  }

  const cfAuthCookie = cookies
    .split(';')
    .find(c => c.trim().startsWith('CF_Authorization='));

  if (!cfAuthCookie) {
    console.log('No CF_Authorization cookie found');
    return { isAuthenticated: false };
  }

  try {
    const token = cfAuthCookie.split('=')[1].trim();
    const decoded = decodeJWT(token);
    
    console.log('Decoded token:', {
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    return { 
      isAuthenticated: true,
      userId: decoded.email
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return { isAuthenticated: false };
  }
}