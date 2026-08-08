import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { UserRepository } from "../../infrastructure/repositories/userRepository";
import { AuthUsecase } from "../../usecase/authUsecase";

export const authController = new Hono<{
	Variables: {
		db: DbInstance;
		JWT_SECRET: string;
	};
}>();

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(1),
});

authController.post(
	"/register",
	zValidator("json", registerSchema),
	async (c) => {
		const { email, password, name } = c.req.valid("json");
		const db = c.get("db");
		const secret = c.get("JWT_SECRET");

		const userRepo = new UserRepository(db);
		const authUsecase = new AuthUsecase(userRepo);

		try {
			const user = await authUsecase.register(email, password, name);
			const token = await sign({ userId: user.id }, secret);

			return c.json(
				{
					token,
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
					},
				},
				201,
			);
		} catch (e) {
			return c.json({ error: e.message }, 400);
		}
	},
);

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(8),
});

authController.post("/login", zValidator("json", loginSchema), async (c) => {
	const { email, password } = c.req.valid("json");
	const db = c.get("db");
	const secret = c.get("JWT_SECRET");

	const userRepo = new UserRepository(db);
	const authUsecase = new AuthUsecase(userRepo);

	try {
		const user = await authUsecase.login(email, password);
		const token = await sign({ userId: user.id }, secret);

		return c.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		});
	} catch (e) {
		return c.json({ error: e.message }, 401);
	}
});
