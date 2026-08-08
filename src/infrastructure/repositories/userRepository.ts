import { eq } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { users } from "../db/schema";

export class UserRepository {
	constructor(private db: DbInstance) {}

	async findByEmail(email: string) {
		const [user] = await this.db
			.select()
			.from(users)
			.where(eq(users.email, email));
		return user;
	}

	async createUser(data: {
		email: string;
		passwordHash: string;
		name: string;
	}) {
		const [user] = await this.db
			.insert(users)
			.values({
				...data,
			})
			.returning();
		return user;
	}
}
