import axios from 'axios';

// ── CODEFORCES ───────────────────────────────────

export async function fetchCFRating(handle: string): Promise<{ rating: number | null; rank: string | null }> {
  try {
    const { data } = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (data.status === 'OK' && data.result.length > 0) {
      const user = data.result[0];
      return {
        rating: user.rating ?? null,
        rank: user.rank ?? null,
      };
    }
  } catch (err) {
    console.error(`[CPStats] CF error for ${handle}:`, err instanceof Error ? err.message : String(err));
  }
  return { rating: null, rank: null };
}

// ── LEETCODE ─────────────────────────────────────

export async function fetchLCRating(username: string): Promise<{ rating: number | null }> {
  try {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          rating
        }
      }
    `;
    const { data } = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username },
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    if (data?.data?.userContestRanking?.rating) {
      return { rating: Math.round(data.data.userContestRanking.rating) };
    }
  } catch (err) {
    console.error(`[CPStats] LC error for ${username}:`, err instanceof Error ? err.message : String(err));
  }
  return { rating: null };
}

// ── CODECHEF ─────────────────────────────────────

export async function fetchCCRating(handle: string): Promise<{ rating: number | null; stars: number | null }> {
  try {
    const { data } = await axios.get(`https://www.codechef.com/users/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });

    // Codechef HTML parsing
    // Rating: <div class="rating-number">1542</div>
    const ratingMatch = data.match(/<div class="rating-number">(\d+)<\/div>/);
    // Stars: <span class="rating">3★</span>
    const starsMatch = data.match(/<span class="rating">(\d)★<\/span>/);

    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
    const stars = starsMatch ? parseInt(starsMatch[1], 10) : null;

    return { rating, stars };
  } catch (err) {
    console.error(`[CPStats] CC error for ${handle}:`, err instanceof Error ? err.message : String(err));
  }
  return { rating: null, stars: null };
}

// ── BATCH UPDATE ─────────────────────────────────

export async function fetchAllStats(cfHandle?: string | null, lcUsername?: string | null, ccHandle?: string | null) {
  const [cf, lc, cc] = await Promise.all([
    cfHandle ? fetchCFRating(cfHandle) : Promise.resolve({ rating: null, rank: null }),
    lcUsername ? fetchLCRating(lcUsername) : Promise.resolve({ rating: null }),
    ccHandle ? fetchCCRating(ccHandle) : Promise.resolve({ rating: null, stars: null }),
  ]);

  return {
    cfRating: cf.rating,
    cfRank: cf.rank,
    lcRating: lc.rating,
    ccRating: cc.rating,
    ccStars: cc.stars,
  };
}
