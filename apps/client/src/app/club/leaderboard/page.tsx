import { permanentRedirect } from 'next/navigation';

export default function ClubLeaderboardRedirectPage() {
  permanentRedirect('/leaderboard');
}
