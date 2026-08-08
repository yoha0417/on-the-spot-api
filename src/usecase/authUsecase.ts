import type { UserRepository } from "../infrastructure/repositories/userRepository";

export class AuthUsecase {
	constructor(private userRepo: UserRepository) {}

	async register(email: string, password: string, name: string) {
		// Check if user exists
		const existing = await this.userRepo.findByEmail(email);
		if (existing) {
			throw new Error("Email already in use");
		}

		// Hash password
		const hashedPassword = await this.hashPassword(password);

		// Create user
		return await this.userRepo.createUser({
			email,
			passwordHash: hashedPassword,
			name,
		});
	}

	async login(email: string, password: string) {
		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			throw new Error("Invalid credentials");
		}

		// Verify password
		const hashedPassword = await this.hashPassword(password);
		if (hashedPassword !== user.passwordHash) {
			throw new Error("Invalid credentials");
		}

		return user;
	}

	private async hashPassword(password: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(password);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}
}
