import type { DbInstance } from "../db/client";
import { visits } from "../db/schema";

export class VisitRepository {
	constructor(private db: DbInstance) {}

	async createVisit(data: {
		userId: string;
		placeId: string;
		checkedInAt: string;
	}) {
		return await this.db.insert(visits).values(data).returning();
	}

	async createChecknedIn(data: {
		userId: string;
		placeId: string;
		checked_in_at: Date;
		last_heartbeat_at: Date;
		status: string;
	}) {
		const [result] = await this.db
			.insert(visits)
			.values({
				userId: data.userId,
				placeId: data.placeId,
				checkedInAt: data.checked_in_at.toISOString(),
				lastHeartbeatAt: data.last_heartbeat_at.toISOString(),
				status: data.status,
			})
			.returning();
		return result;
	}
}
