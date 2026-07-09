import { Router, Request, Response } from 'express';
import { getDailyProblems } from '../services/dailyProblems';

const router = Router();

// GET /api/daily-problems
router.get('/', async (req: Request, res: Response) => {
  try {
    const problems = await getDailyProblems();
    res.json({ success: true, data: problems });
  } catch (error: any) {
    console.error('[DailyProblems] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily problems' });
  }
});

export default router;
