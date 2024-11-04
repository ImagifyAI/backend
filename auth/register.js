import bcrypt from "bcryptjs";

export default async function handleRegister(request, env) {
	if (request.method !== 'POST') {
		return new Response("Method not allowed", { status: 405 });
	}

	const { email, password } = await request.json();
	if (!email || !password) {
		return new Response("Email and password are required", { status: 400 });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await env.MY_DB.prepare(
			`INSERT INTO users (email, password) VALUES (?, ?)`
		).bind(email, hashedPassword).run();
	} catch (error) {
		console.error("Registration error:", error);
		return new Response("Email already registered", { status: 409 });
	}

	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
}
