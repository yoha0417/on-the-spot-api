import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

export const authMiddleware: MiddlewareHandler<{
	Variables: {
		userId: string;
		JWT_SECRET: string;
	};
}> = async (c, next) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const token = authHeader.split(" ")[1];
	const secret = c.get("JWT_SECRET");

	try {
		const payload = await verify(token, secret, "HS256");
		// TypeScriptのエラーを防ぐため、payload.userId を string にキャストするか型を明記する
		c.set("userId", payload.userId as string);
		await next();
	} catch (_e) {
		return c.json({ error: "Invalid token" }, 401);
	}
};
