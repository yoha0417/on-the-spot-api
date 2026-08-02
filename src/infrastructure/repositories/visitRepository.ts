import { visits } from '../db/schema';

export class VisitRepository {

  constructor(private db: any) {}

  async createVisit(data: {
    userId: string;
    placeId: string;
    checkedInAt: string;
  }) {
    return await this.db.insert(visits).values(data).returning();
  }
}