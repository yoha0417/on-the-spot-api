import { PlaceRepository } from '../infrastructure/repositories/placeRepository';
import { VisitRepository } from '../infrastructure/repositories/visitRepository';
import { getBoundingBox, calculateHaversineDistance } from '../utils/geo';

export class CheckInUsecase {
  // 修正箇所: = new ...() を削除し、外部から受け取ることを強制する
  constructor(
    private placeRepo: PlaceRepository,
    private visitRepo: VisitRepository
  ) {}

  async execute(lat: number, lng: number) {
    // 1. Calculate bounding box
    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng);

    // 2. Get places within bounding box
    const places = await this.placeRepo.findPlacesWithinBoundingBox(
      minLat, maxLat, minLng, maxLng
    );

    // 3. Filter by exact distance
    const validPlaces = places.filter(place => {
      const distance = calculateHaversineDistance(
        lat, lng, place.latitude, place.longitude
      );
      return distance <= 50; // 50m threshold
    });

    // 4. Create check-in records
    const results = await Promise.all(
      validPlaces.map(place =>
        this.visitRepo.createVisit({
          userId: 'current-user-id', // Replace with actual user context
          placeId: place.id,
          checkedInAt: new Date().toISOString()
        })
      )
    );

    return results;
  }
}