import { Hono } from 'hono';
import { CheckInUsecase } from '../../usecase/checkInUsecase';
import { PlaceRepository } from '../../infrastructure/repositories/placeRepository'; // 適切なパスに合わせてください
import { VisitRepository } from '../../infrastructure/repositories/visitRepository';

// Variablesの型を定義して c.get('db') でエラーが出ないようにする
export const checkInController = new Hono<{ Variables: { db: any } }>();

checkInController.post('/api/checkin', async (c) => {
  try {
    const { lat, lng } = await c.req.json();

    // 1. HonoのコンテキストからDBインスタンスを取得
    const db = c.get('db');
    if (!db) {
      throw new Error("DB instance is missing in Hono context");
    }

    // 2. RepositoryにDBを渡し、UseCaseにRepositoryを渡す
    const placeRepository = new PlaceRepository(db);
    const visitRepository = new VisitRepository(db);
    const usecase = new CheckInUsecase(placeRepository,visitRepository);

    const results = await usecase.execute(lat, lng);
    return c.json(results);

  } catch (error) {
    console.error('[Check-in Error]', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Check-in failed', details: errorMessage }, 500);
  }
});