import { and, eq, lt } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { type VisitStatus, visits } from "../db/schema";

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
		status: VisitStatus;
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

	async findActiveVisitByUserAndPlace(userId: string, placeId: string) {
		const [visit] = await this.db
			.select()
			.from(visits)
			.where(
				and(
					eq(visits.userId, userId),
					eq(visits.placeId, placeId),
					eq(visits.status, "active"),
				),
			);
		return visit;
	}

	async updateHeartbeat(id: string, lastHeartbeatAt: Date) {
		const [result] = await this.db
			.update(visits)
			.set({
				lastHeartbeatAt: lastHeartbeatAt.toISOString(),
			})
			.where(eq(visits.id, id))
			.returning();
		return result;
	}

	async checkout(id: string, checkedOutAt: Date) {
		const [result] = await this.db
			.update(visits)
			.set({
				status: "checked_out",
				checkedOutAt: checkedOutAt.toISOString(),
			})
			.where(eq(visits.id, id))
			.returning();
		return result;
	}

	async autoCheckoutExpiredVisits(threshold: Date, checkoutTime: Date) {
		return await this.db
			.update(visits)
			.set({
				status: "checked_out",
				checkedOutAt: checkoutTime.toISOString(),
			})
			.where(
				and(
					eq(visits.status, "active"),
					lt(visits.lastHeartbeatAt, threshold.toISOString()),
				),
			)
			.returning();
	}
}
