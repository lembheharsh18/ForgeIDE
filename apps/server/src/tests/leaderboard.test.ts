// ── Leaderboard Service Tests ────────────────────

// These are unit tests for the scoring functions.
// The actual DB-interacting functions require a running database,
// so they would run in CI with Postgres service.

describe('calculateProblemScore (scoring logic)', () => {
  // Replicate the scoring logic here for unit testing
  // This mirrors the private function in leaderboard.ts
  function calculateProblemScore(platform: string, difficulty: string): number {
    const d = difficulty.toLowerCase();
    const n = parseInt(difficulty);

    if (platform === 'CODEFORCES' && !isNaN(n)) {
      return Math.max(1, Math.round(n / 400));
    }

    if (d === 'easy') return 1;
    if (d === 'medium') return 2;
    if (d === 'hard') return 4;

    if (!isNaN(n)) return Math.max(1, Math.round(n / 400));
    return 1;
  }

  it('scores DSA easy as 1 point', () => {
    expect(calculateProblemScore('CUSTOM', 'easy')).toBe(1);
  });

  it('scores DSA medium as 2 points', () => {
    expect(calculateProblemScore('CUSTOM', 'medium')).toBe(2);
  });

  it('scores DSA hard as 4 points', () => {
    expect(calculateProblemScore('CUSTOM', 'hard')).toBe(4);
  });

  it('scores CF 800-rated as 2 points', () => {
    expect(calculateProblemScore('CODEFORCES', '800')).toBe(2);
  });

  it('scores CF 1600-rated as 4 points', () => {
    expect(calculateProblemScore('CODEFORCES', '1600')).toBe(4);
  });

  it('scores CF 2400-rated as 6 points', () => {
    expect(calculateProblemScore('CODEFORCES', '2400')).toBe(6);
  });

  it('sums multiple solved problems correctly', () => {
    const problems = [
      { platform: 'CUSTOM', difficulty: 'easy' },
      { platform: 'CUSTOM', difficulty: 'medium' },
      { platform: 'CUSTOM', difficulty: 'hard' },
      { platform: 'CODEFORCES', difficulty: '800' },
    ];

    const total = problems.reduce(
      (sum, p) => sum + calculateProblemScore(p.platform, p.difficulty),
      0,
    );
    // easy(1) + medium(2) + hard(4) + CF800(2) = 9
    expect(total).toBe(9);
  });

  it('defaults unknown difficulty to 1 point', () => {
    expect(calculateProblemScore('CUSTOM', 'unknown')).toBe(1);
  });
});

describe('rank assignment logic', () => {
  it('assigns rank 1 to highest score', () => {
    const entries = [
      { userId: 'a', score: 100 },
      { userId: 'b', score: 50 },
      { userId: 'c', score: 25 },
    ];

    // Sort descending and assign ranks
    const sorted = entries.sort((a, b) => b.score - a.score);
    const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));

    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].userId).toBe('a');
  });

  it('assigns correct ranks to all users', () => {
    const entries = [
      { userId: 'c', score: 25 },
      { userId: 'a', score: 100 },
      { userId: 'b', score: 50 },
    ];

    const sorted = entries.sort((a, b) => b.score - a.score);
    const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));

    expect(ranked).toEqual([
      { userId: 'a', score: 100, rank: 1 },
      { userId: 'b', score: 50, rank: 2 },
      { userId: 'c', score: 25, rank: 3 },
    ]);
  });
});
