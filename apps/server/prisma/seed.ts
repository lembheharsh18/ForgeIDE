/* eslint-disable no-console */
import { PrismaClient, Role, Platform } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ── Seed Data ────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await prisma.submission.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Users ───────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@forge.dev',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      codeforcesHandle: 'forge_admin',
      avatarUrl: null,
    },
  });
  console.log(`  ✓ Admin: ${admin.username} (${admin.email})`);

  const memberUsernames = [
    { username: 'arjun_cp', email: 'arjun@forge.dev', cfHandle: 'arjun_cf' },
    { username: 'sneha_algo', email: 'sneha@forge.dev', cfHandle: 'sneha_cf' },
    { username: 'rohan_dev', email: 'rohan@forge.dev', cfHandle: 'rohan_dev' },
    { username: 'priya_code', email: 'priya@forge.dev', cfHandle: 'priya_cf' },
    { username: 'vikram_cp', email: 'vikram@forge.dev', cfHandle: 'vikram_cp' },
    { username: 'ananya_dsa', email: 'ananya@forge.dev', cfHandle: 'ananya_ds' },
    { username: 'karthik_42', email: 'karthik@forge.dev', cfHandle: 'karthik42' },
    { username: 'meera_bits', email: 'meera@forge.dev', cfHandle: 'meera_cf' },
    { username: 'aditya_pro', email: 'aditya@forge.dev', cfHandle: 'aditya_pr' },
    { username: 'neha_codes', email: 'neha@forge.dev', cfHandle: 'neha_code' },
  ];

  const memberPassword = await bcrypt.hash('Member@123', 12);
  const members = [];

  for (const m of memberUsernames) {
    const user = await prisma.user.create({
      data: {
        username: m.username,
        email: m.email,
        passwordHash: memberPassword,
        role: Role.MEMBER,
        codeforcesHandle: m.cfHandle,
      },
    });
    members.push(user);
    console.log(`  ✓ Member: ${user.username}`);
  }

  const allUsers = [admin, ...members];

  // ── 2. Problems ────────────────────────────────

  const problems = await Promise.all([
    // ── Codeforces Problems (8) ──
    prisma.problem.create({
      data: {
        title: 'Theatre Square',
        platform: Platform.CODEFORCES,
        difficulty: '1000',
        tags: ['math', 'implementation'],
        link: 'https://codeforces.com/problemset/problem/1/A',
        statement:
          "Theatre Square in the capital city of Berland has a rectangular shape with the size n × m meters. On the occasion of the city's anniversary, a decision was made to pave the square with square granite flagstones. Each flagstone has the size a × a.",
        inputSpec:
          'The input contains three positive integers in the first line: n, m and a (1 ≤ n, m, a ≤ 10^9).',
        outputSpec: 'Write the needed number of flagstones.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: '1',
        cfIndex: 'A',
        addedById: admin.id,
        testCases: [
          { input: '6 6 4', output: '4' },
          { input: '1 1 1', output: '1' },
          { input: '2 3 4', output: '1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'The Best Gift',
        platform: Platform.CODEFORCES,
        difficulty: '900',
        tags: ['implementation', 'strings'],
        link: 'https://codeforces.com/problemset/problem/2/B',
        statement:
          'You have n books, each belonging to a certain genre. Find the number of ways to choose two books of different genres.',
        inputSpec:
          'The first line contains a single integer n. The second line contains n integers — the genres of the books.',
        outputSpec: 'Print the number of ways to choose two books of different genres.',
        noteSection: null,
        timeLimit: 2000,
        memoryLimit: 256000,
        cfContestId: '2',
        cfIndex: 'B',
        addedById: admin.id,
        testCases: [
          { input: '4\n1 2 1 3', output: '5' },
          { input: '3\n1 1 1', output: '0' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Taxi',
        platform: Platform.CODEFORCES,
        difficulty: '1100',
        tags: ['greedy', 'implementation'],
        link: 'https://codeforces.com/problemset/problem/158/B',
        statement:
          'After a long day of work, n students are going home by taxi. Each group can have at most 4 members. Determine the minimum number of taxis required.',
        inputSpec: 'First line n, then n integers: group sizes (1 to 4).',
        outputSpec: 'Print the minimum number of taxis needed.',
        noteSection: 'In the first example, three groups of size 1 can share one taxi.',
        timeLimit: 3000,
        memoryLimit: 256000,
        cfContestId: '158',
        cfIndex: 'B',
        addedById: admin.id,
        testCases: [
          { input: '5\n1 2 4 3 3', output: '4' },
          { input: '8\n2 3 4 4 2 1 3 1', output: '5' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Mocha and Hiking',
        platform: Platform.CODEFORCES,
        difficulty: '1700',
        tags: ['graphs', 'constructive algorithms', 'dp'],
        link: 'https://codeforces.com/problemset/problem/1557/C',
        statement:
          'There are n+1 cities numbered from 1 to n+1, and edges from city i to city i+1 for each i. Additionally, city i has a value a_i. If a_i = 1, there is an edge from city i to city n+1. Mocha wants to travel from city 1 to city n+1. Find a Hamiltonian path or report that none exists.',
        inputSpec:
          'First line t — test cases. Each test case: first line n, second line n integers a_1, a_2, ..., a_n.',
        outputSpec: 'For each test case, print the path if it exists, or -1.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: '1557',
        cfIndex: 'C',
        addedById: admin.id,
        testCases: [
          { input: '1\n3\n0 1 0', output: '1 2 4 3' },
          { input: '1\n2\n0 0', output: '-1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Watermelon',
        platform: Platform.CODEFORCES,
        difficulty: '800',
        tags: ['brute force', 'math'],
        link: 'https://codeforces.com/problemset/problem/4/A',
        statement:
          'Pete and Billy bought a watermelon and want to divide it into two parts, each part weighing even number of kilos. Determine if it is possible.',
        inputSpec:
          'The first line contains number w (1 ≤ w ≤ 100) — the weight of the watermelon bought.',
        outputSpec: 'Print YES if they can split, NO otherwise.',
        noteSection: 'For example, the watermelon weighing 8 can be split into 2+6 or 4+4.',
        timeLimit: 1000,
        memoryLimit: 65536,
        cfContestId: '4',
        cfIndex: 'A',
        addedById: admin.id,
        testCases: [
          { input: '8', output: 'YES' },
          { input: '3', output: 'NO' },
          { input: '2', output: 'NO' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Way Too Long Words',
        platform: Platform.CODEFORCES,
        difficulty: '800',
        tags: ['strings', 'implementation'],
        link: 'https://codeforces.com/problemset/problem/71/A',
        statement:
          'Sometimes abbreviations are used. Write a function that replaces long words with abbreviations: first letter, count of middle letters, last letter.',
        inputSpec: 'First line: n (number of words). Next n lines — one word each.',
        outputSpec: 'For each word, print the abbreviation or the word if its length ≤ 10.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: '71',
        cfIndex: 'A',
        addedById: admin.id,
        testCases: [
          {
            input:
              '4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis',
            output: 'word\nl10n\ni18n\np43s',
          },
          { input: '1\nabcdefghij', output: 'abcdefghij' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Team',
        platform: Platform.CODEFORCES,
        difficulty: '800',
        tags: ['brute force', 'greedy'],
        link: 'https://codeforces.com/problemset/problem/231/A',
        statement:
          'Three friends want to participate in contests. They will participate if at least two of them are sure about the solution. Given n problems, determine how many they will solve.',
        inputSpec: 'First line n. Each of next n lines contains three integers (0 or 1).',
        outputSpec: 'Print the number of problems they will solve.',
        noteSection: null,
        timeLimit: 2000,
        memoryLimit: 256000,
        cfContestId: '231',
        cfIndex: 'A',
        addedById: admin.id,
        testCases: [
          { input: '3\n1 1 0\n1 1 1\n1 0 0', output: '2' },
          { input: '2\n1 0 0\n0 1 1', output: '1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Next Round',
        platform: Platform.CODEFORCES,
        difficulty: '800',
        tags: ['implementation'],
        link: 'https://codeforces.com/problemset/problem/158/A',
        statement:
          'Given a sorted list of scores and a value k, find how many participants advance to the next round. A participant advances if their score is positive and ≥ the k-th place score.',
        inputSpec: 'First line: n and k. Second line: n scores in non-increasing order.',
        outputSpec: 'Print the number of advancing participants.',
        noteSection: null,
        timeLimit: 3000,
        memoryLimit: 256000,
        cfContestId: '158',
        cfIndex: 'A',
        addedById: admin.id,
        testCases: [
          { input: '8 5\n10 9 8 7 7 7 5 5', output: '6' },
          { input: '4 2\n0 0 0 0', output: '0' },
        ],
      },
    }),

    // ── Custom DSA Problems (7) ──
    prisma.problem.create({
      data: {
        title: 'Two Sum',
        platform: Platform.CUSTOM,
        difficulty: 'Easy',
        tags: ['arrays', 'hash-map'],
        link: null,
        statement:
          'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        inputSpec:
          'First line: n (array size) and target. Second line: n space-separated integers.',
        outputSpec: 'Print two 0-indexed indices separated by a space.',
        noteSection: 'You can return the answer in any order.',
        timeLimit: 2000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '4 9\n2 7 11 15', output: '0 1' },
          { input: '3 6\n3 2 4', output: '1 2' },
          { input: '2 6\n3 3', output: '0 1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Longest Common Subsequence',
        platform: Platform.CUSTOM,
        difficulty: 'Medium',
        tags: ['dynamic-programming', 'strings'],
        link: null,
        statement:
          'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is a sequence that can be derived from another sequence by deleting some or no elements without changing the order of the remaining elements.',
        inputSpec: 'First line: text1. Second line: text2.',
        outputSpec: 'Print the length of the longest common subsequence.',
        noteSection: null,
        timeLimit: 2000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: 'abcde\nace', output: '3' },
          { input: 'abc\nabc', output: '3' },
          { input: 'abc\ndef', output: '0' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Binary Search',
        platform: Platform.CUSTOM,
        difficulty: 'Easy',
        tags: ['binary-search', 'arrays'],
        link: null,
        statement:
          'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.',
        inputSpec: 'First line: n and target. Second line: n sorted integers.',
        outputSpec: 'Print the index of target, or -1 if not found.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '6 9\n-1 0 3 5 9 12', output: '4' },
          { input: '6 2\n-1 0 3 5 9 12', output: '-1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Merge Intervals',
        platform: Platform.CUSTOM,
        difficulty: 'Medium',
        tags: ['arrays', 'sorting', 'greedy'],
        link: null,
        statement:
          'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
        inputSpec:
          'First line: n (number of intervals). Next n lines: two integers start and end for each interval.',
        outputSpec: 'Print merged intervals, one per line.',
        noteSection: null,
        timeLimit: 2000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '4\n1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18' },
          { input: '2\n1 4\n4 5', output: '1 5' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Shortest Path in Graph',
        platform: Platform.CUSTOM,
        difficulty: 'Hard',
        tags: ['graphs', 'dijkstra', 'shortest-path'],
        link: null,
        statement:
          'Given a weighted directed graph with n vertices and m edges, find the shortest path from vertex 1 to vertex n. If no path exists, output -1.',
        inputSpec: 'First line: n and m. Next m lines: u v w (edge from u to v with weight w).',
        outputSpec: 'Print the length of the shortest path, or -1 if no path exists.',
        noteSection: null,
        timeLimit: 3000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 6\n3 4 3', output: '6' },
          { input: '2 0', output: '-1' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Maximum Subarray Sum',
        platform: Platform.CUSTOM,
        difficulty: 'Easy',
        tags: ['arrays', 'dynamic-programming', 'kadane'],
        link: null,
        statement:
          'Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.',
        inputSpec: 'First line: n (array size). Second line: n space-separated integers.',
        outputSpec: 'Print the maximum subarray sum.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' },
          { input: '1\n1', output: '1' },
          { input: '5\n5 4 -1 7 8', output: '23' },
        ],
      },
    }),
    prisma.problem.create({
      data: {
        title: 'Valid Parentheses',
        platform: Platform.CUSTOM,
        difficulty: 'Easy',
        tags: ['stack', 'strings'],
        link: null,
        statement:
          "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type and in the correct order.",
        inputSpec: 'A single line containing the string s.',
        outputSpec: 'Print YES if valid, NO otherwise.',
        noteSection: null,
        timeLimit: 1000,
        memoryLimit: 256000,
        cfContestId: null,
        cfIndex: null,
        addedById: admin.id,
        testCases: [
          { input: '()', output: 'YES' },
          { input: '()[]{}', output: 'YES' },
          { input: '(]', output: 'NO' },
        ],
      },
    }),
  ]);

  console.log(`\n  ✓ Created ${problems.length} problems`);

  // ── 3. Contests ────────────────────────────────

  const contests = await Promise.all([
    // 3 upcoming
    prisma.contest.create({
      data: {
        name: 'Codeforces Round #950 (Div. 2)',
        platform: Platform.CODEFORCES,
        startTime: futureDate(3),
        endTime: futureDate(3),
        link: 'https://codeforces.com/contests',
        description: 'Regular Codeforces Div 2 round with 6 problems. Duration: 2 hours.',
        participants: { connect: allUsers.slice(0, 6).map((u) => ({ id: u.id })) },
      },
    }),
    prisma.contest.create({
      data: {
        name: 'FORGE Weekly Challenge #12',
        platform: Platform.CUSTOM,
        startTime: futureDate(7),
        endTime: futureDate(7),
        link: 'https://forge.dev/contests/weekly-12',
        description:
          'Weekly internal contest for PICT Coders League members. 5 problems, 2 hour duration.',
        participants: { connect: allUsers.map((u) => ({ id: u.id })) },
      },
    }),
    prisma.contest.create({
      data: {
        name: 'AtCoder Beginner Contest 380',
        platform: Platform.ATCODER,
        startTime: futureDate(10),
        endTime: futureDate(10),
        link: 'https://atcoder.jp/contests/abc380',
        description: 'AtCoder Beginner Contest with problems A through G.',
        participants: { connect: allUsers.slice(2, 8).map((u) => ({ id: u.id })) },
      },
    }),
    // 2 past
    prisma.contest.create({
      data: {
        name: 'Codeforces Round #945 (Div. 2)',
        platform: Platform.CODEFORCES,
        startTime: pastDate(10),
        endTime: pastDate(10),
        link: 'https://codeforces.com/contest/1985',
        description: 'Past Codeforces Div 2 round.',
        participants: { connect: allUsers.slice(0, 8).map((u) => ({ id: u.id })) },
      },
    }),
    prisma.contest.create({
      data: {
        name: 'FORGE Weekly Challenge #11',
        platform: Platform.CUSTOM,
        startTime: pastDate(7),
        endTime: pastDate(7),
        link: 'https://forge.dev/contests/weekly-11',
        description: 'Past weekly internal contest.',
        participants: { connect: allUsers.slice(0, 9).map((u) => ({ id: u.id })) },
      },
    }),
  ]);

  console.log(`  ✓ Created ${contests.length} contests`);

  // ── 4. Leaderboard Entries ─────────────────────

  const leaderboardData = allUsers.map((user, i) => ({
    userId: user.id,
    score: Math.max(0, 2500 - i * 200 + randomInt(-50, 50)),
    solvedCount: Math.max(0, 45 - i * 3 + randomInt(-2, 2)),
    rank: i + 1,
  }));

  for (const entry of leaderboardData) {
    await prisma.leaderboardEntry.create({ data: entry });
  }
  console.log(`  ✓ Created ${leaderboardData.length} leaderboard entries`);

  // ── 5. Submissions ────────────────────────────

  const languages = ['cpp', 'python', 'java', 'javascript'];
  const verdicts = ['ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'ACCEPTED'];

  const submissionPromises = [];

  for (const user of allUsers) {
    // Each user makes 2-4 submissions on random problems
    const numSubmissions = randomInt(2, 4);
    for (let s = 0; s < numSubmissions; s++) {
      const problem = problems[randomInt(0, problems.length - 1)];
      const lang = languages[randomInt(0, languages.length - 1)];
      const verdict = verdicts[randomInt(0, verdicts.length - 1)];

      submissionPromises.push(
        prisma.submission.create({
          data: {
            userId: user.id,
            problemId: problem.id,
            language: lang,
            code: `// Solution by ${user.username} for "${problem.title}"\n// Language: ${lang}\n\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // TODO: implement solution\n    return 0;\n}\n`,
            verdict,
            timeMs: verdict === 'TIME_LIMIT_EXCEEDED' ? null : randomInt(15, 1500),
            memoryKb: randomInt(1024, 65536),
            errorMsg: verdict === 'RUNTIME_ERROR' ? 'Segmentation fault' : null,
          },
        }),
      );
    }
  }

  const submissions = await Promise.all(submissionPromises);
  console.log(`  ✓ Created ${submissions.length} submissions`);

  // ── Connect solved problems ────────────────────
  // Mark some problems as solved by users who got ACCEPTED
  const acceptedSubmissions = await prisma.submission.findMany({
    where: { verdict: 'ACCEPTED' },
    select: { userId: true, problemId: true },
  });

  const uniqueSolves = new Map<string, Set<string>>();
  for (const sub of acceptedSubmissions) {
    if (!uniqueSolves.has(sub.problemId)) {
      uniqueSolves.set(sub.problemId, new Set());
    }
    uniqueSolves.get(sub.problemId)!.add(sub.userId);
  }

  for (const [problemId, userIds] of uniqueSolves) {
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        solvedBy: {
          connect: Array.from(userIds).map((id) => ({ id })),
        },
      },
    });
  }

  console.log(`  ✓ Linked solved problems\n`);
  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
