export default async function handleCart(request, env, userId) {
    return setCORSHeaders(new Response("Cart endpoint", { status: 200 }));
}
