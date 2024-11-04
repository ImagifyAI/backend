import jwt from "jsonwebtoken";

export default async function handleLogin(request, env) {
	if (request.method !== 'POST') {
		return new Response("Method not allowed", { status: 405 });
	}

	const { email, password } = await request.json();
	if (!email || !password) {
		return new Response("Email and password are required", { status: 400 });
	}

	const result = await env.MY_DB.prepare(
		`SELECT id, password FROM users WHERE email = ?`
	).bind(email).first();

	if (!result || !(await bcrypt.compare(password, result.password))) {
		return new Response("Invalid email or password", { status: 401 });
	}

	const token = jwt.sign({ sub: result.id, email }, env.JWT_SECRET, { expiresIn: '1h' });

	return new Response(JSON.stringify({ success: true, token }), {
		headers: { "Content-Type": "application/json" },
	});
}
