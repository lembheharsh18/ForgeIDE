import { render, screen, waitFor } from '@testing-library/react';

import ClubHomePage from '../../app/club/page';
import api from '../../lib/axios';

jest.mock('../../lib/axios');

jest.mock('../../components/layout/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/layout/Topbar', () => ({
  Topbar: () => <div data-testid="topbar" />,
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user_1', username: 'alice', role: 'MEMBER' },
  }),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('ClubHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders club widgets with mocked aggregation data', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        generatedAt: new Date('2026-07-03T10:00:00.000Z').toISOString(),
        dailyQuestions: {
          source: 'TEST',
          message: 'Daily question test source',
          items: [
            {
              title: 'Two Sum',
              platform: 'LeetCode',
              difficulty: 'Easy',
              url: 'https://leetcode.com/problems/two-sum/',
            },
          ],
        },
        contestReminders: {
          source: 'TEST',
          message: 'Contest reminder test source',
          windowDays: 14,
          items: [
            {
              title: 'Codeforces Round',
              platform: 'Codeforces',
              startTime: '2026-07-04T14:35:00.000Z',
              url: 'https://codeforces.com/contests',
            },
          ],
        },
        todayTopSolvers: {
          source: 'TEST',
          message: 'Top solver test source',
          since: '2026-07-03T00:00:00.000Z',
          solvers: [
            {
              userId: 'user_1',
              username: 'alice',
              avatarUrl: null,
              solveCount: 3,
              lastSolvedAt: '2026-07-03T09:00:00.000Z',
            },
          ],
        },
        leaderboardPreview: {
          source: 'TEST',
          message: 'Leaderboard test source',
          entries: [
            {
              rank: 1,
              userId: 'user_1',
              username: 'alice',
              score: 120,
              solvedCount: 40,
            },
          ],
        },
      },
    });

    render(<ClubHomePage />);

    expect(screen.getByText('Daily Questions')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Two Sum')).toBeInTheDocument());
    expect(screen.getByText('Codeforces Round')).toBeInTheDocument();
    expect(screen.getByText('3 accepted')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });
});
