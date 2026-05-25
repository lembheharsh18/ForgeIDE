import type { Language, Platform, Role, Verdict } from './enums';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: Role;
  cfHandle?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: Platform;
  externalUrl?: string;
  externalId?: string;
  timeLimit: number;
  memoryLimit: number;
  inputFormat?: string;
  outputFormat?: string;
  sampleInput?: string;
  sampleOutput?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  runtime?: number;
  memory?: number;
  output?: string;
  error?: string;
  submittedAt: Date;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  problems: string[];
  participants: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  totalScore: number;
  problemsSolved: number;
  totalPenalty: number;
  problemResults: ProblemResult[];
}

export interface ProblemResult {
  problemId: string;
  solved: boolean;
  attempts: number;
  solvedAt?: Date;
  penalty: number;
}
