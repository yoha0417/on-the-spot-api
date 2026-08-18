import { and, eq, lt } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { type VisitStatus, visits, places } from "../db/schema";

export class VisitRepository {
	constructor(private db: DbInstance) {}

	async createVisit(data: {
		userId: string;
		placeId: string;
		checkedInAt: string;
	}) {
		return await this.db
			.insert(visits)
			.values({
				userId: data.userId,
				placeId: data.placeId,
				checkedInAt: data.checkedInAt,
				lastHeartbeatAt: data.checkedInAt,
				status: "active",
				checkedOutAt: null,
			})
			.returning();
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
				checkedOutAt: null,
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

	async findVisitsWithPlaceByUserId(userId: string) {
		const rows = await this.db
			.select({
				visitId: visits.id,
				checkedInAt: visits.checkedInAt,
				checkedOutAt: visits.checkedOutAt,
				status: visits.status,
				placeId: places.id,
				placeName: places.name,
				placeLatitude: places.latitude,
				placeLongitude: places.longitude,
				placeAddress: places.address,
			})
			.from(visits)
			.innerJoin(places, eq(visits.placeId, places.id))
			.where(eq(visits.userId, userId))
			.orderBy(visits.checkedInAt);

		return rows;
	}
}
