import { Hono } from 'hono';
import { CheckInUsecase } from '../../usecase/checkInUsecase';
import { PlaceRepository } from '../../infrastructure/repositories/placeRepository'; // 適切なパスに合わせてください
import { VisitRepository } from '../../infrastructure/repositories/visitRepository';

// Variablesの型を定義して c.get('db') でエラーが出ないようにする
export const checkInController = new Hono<{ Variables: { db: any } }>();

// Haversine formula for distance calculation
const toRadians = (degrees: number) => degrees * Math.PI / 180;
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

checkInController.post('/', async (c) => {
  try {
    const { lat, lng, placeId } = await c.req.json();

    // 1. HonoのコンテキストからDBインスタンスを取得
    const db = c.get('db');
    if (!db) {
      throw new Error("DB instance is missing in Hono context");
    }

    // 2. RepositoryにDBを渡し、UseCaseにRepositoryを渡す
    const placeRepository = new PlaceRepository(db);
    const visitRepository = new VisitRepository(db);
    const usecase = new CheckInUsecase(placeRepository,visitRepository);

    const place = await placeRepository.findByPlaceId(placeId);
  if (!place) {
    return c.json({ error: 'Place not found' }, 404);
  }

  const distance = getDistance(lat, lng, place.latitude, place.longitude);
  if (distance > 50) {
    return c.json({ error: 'チェックイン範囲外です' }, 400);
  }

  const visit = await visitRepository.create({
    userId: 'current-user-id',
    placeId,
    checked_in_at: new Date(),
    last_heartbeat_at: new Date(),
    status: 'active'
  });

  return c.json(visit, 200);
    return c.json(results);

  } catch (error) {
    console.error('[Check-in Error]', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Check-in failed', details: errorMessage }, 500);
  }
});