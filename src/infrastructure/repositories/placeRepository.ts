import { db } from '../db/client';
import { places } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export class PlaceRepository {

  constructor(private db: any) {}
  
  async findPlacesWithinBoundingBox(
    minLat: number, 
    maxLat: number, 
    minLng: number, 
    maxLng: number
  ) {
    return await this.db.select().from(places)
      .where(
        and(
          sql`${places.latitude} BETWEEN ${minLat} AND ${maxLat}`,
          sql`${places.longitude} BETWEEN ${minLng} AND ${maxLng}`
        )
      );
  }
}