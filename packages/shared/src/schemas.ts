import { z } from 'zod';

// ── Enum Schemas ─────────────────────────────────
export const VerdictSchema = z.enum(['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'PENDING']);
export const LanguageSchema = z.enum(['cpp', 'python', 'java', 'javascript', 'go']);
export const PlatformSchema = z.enum(['CODEFORCES', 'ATCODER', 'LEETCODE', 'CUSTOM']);
export const RoleSchema = z.enum(['MEMBER', 'ADMIN']);
export const DifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

// ── User Schema ──────────────────────────────────
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  role: RoleSchema,
  cfHandle: z.string().optional(),
  rating: z.number().int().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ── Problem Schema ───────────────────────────────
export const ProblemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: DifficultySchema,
  platform: PlatformSchema,
  externalUrl: z.string().url().optional(),
  externalId: z.string().optional(),
  timeLimit: z.number().positive(),
  memoryLimit: z.number().positive(),
  inputFormat: z.string().optional(),
  outputFormat: z.string().optional(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  tags: z.array(z.string()),
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ── Submission Schema ────────────────────────────
export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  problemId: z.string().uuid(),
  language: LanguageSchema,
  code: z.string().min(1).max(100000),
  verdict: VerdictSchema,
  runtime: z.number().nonnegative().optional(),
  memory: z.number().nonnegative().optional(),
  output: z.string().optional(),
  error: z.string().optional(),
  submittedAt: z.coerce.date(),
});

// ── Contest Schema ───────────────────────────────
export const ContestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  duration: z.number().positive(),
  problems: z.array(z.string().uuid()),
  participants: z.array(z.string().uuid()),
  isPublic: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ── Leaderboard Schema ───────────────────────────
export const ProblemResultSchema = z.object({
  problemId: z.string().uuid(),
  solved: z.boolean(),
  attempts: z.number().int().nonnegative(),
  solvedAt: z.coerce.date().optional(),
  penalty: z.number().int().nonnegative(),
});

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  username: z.string(),
  displayName: z.string(),
  avatar: z.string().url().optional(),
  totalScore: z.number(),
  problemsSolved: z.number().int().nonnegative(),
  totalPenalty: z.number().int().nonnegative(),
  problemResults: z.array(ProblemResultSchema),
});

// ── Inferred Types (from schemas) ────────────────
export type UserInput = z.infer<typeof UserSchema>;
export type ProblemInput = z.infer<typeof ProblemSchema>;
export type SubmissionInput = z.infer<typeof SubmissionSchema>;
export type ContestInput = z.infer<typeof ContestSchema>;
export type LeaderboardEntryInput = z.infer<typeof LeaderboardEntrySchema>;
