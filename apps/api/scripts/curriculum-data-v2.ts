// Phase 3 curriculum extension: 40 more universal-language exercises.
// Targets gaps in the original 130-problem set — more dynamic programming,
// graph/tree, advanced strings, and competitive-style math. Same shape and
// helpers as curriculum-data.ts so the existing seeder picks them up via a
// single concatenation.

import {
  type Exercise,
  py,
  js,
  cMain,
  cppMain,
  javaMain,
  s_oneInt,
  s_twoInt,
  s_oneString,
  s_intArrayFirstLineN,
} from './curriculum-data';

const E = (e: Exercise): Exercise => e;

export const CURRICULUM_V2: Exercise[] = [
  // ===== Advanced strings (10) =====
  E({
    title: 'Longest palindromic substring length',
    slug: 'curr2-longest-pal-substr-len',
    difficulty: 'medium',
    section: 'Strings',
    topics: ['Strings', 'DP', 'Two Pointers'],
    description:
      'Read string s (length 1..1000, lowercase). Print the length of the longest palindromic substring.',
    examples: [{ input: 'babad', output: '3' }],
    tests: [
      { input: 'babad', output: '3' },
      { input: 'cbbd', output: '2' },
      { input: 'a', output: '1' },
      { input: 'forgeeksskeegfor', output: '10' },
    ],
    starters: s_oneString('Expand around each center'),
  }),
  E({
    title: 'Group anagrams count',
    slug: 'curr2-anagram-groups',
    difficulty: 'medium',
    section: 'Strings',
    topics: ['Strings', 'Hashing'],
    description:
      'Read N then N strings (one per line). Print the number of distinct anagram groups.',
    examples: [{ input: '3\neat\ntea\ntan', output: '2' }],
    tests: [
      { input: '6\neat\ntea\ntan\nate\nnat\nbat', output: '3' },
      { input: '1\na', output: '1' },
      { input: '4\nabc\nbca\nxyz\nzyx', output: '2' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\nwords = lines[1:n+1]\n# Sort letters as key\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst words = lines.slice(1, n + 1);\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Longest common subsequence length',
    slug: 'curr2-lcs-length',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Strings'],
    description:
      'Read two lines: strings a and b (each length 1..500). Print the length of their longest common subsequence.',
    examples: [{ input: 'abcde\nace', output: '3' }],
    tests: [
      { input: 'abcde\nace', output: '3' },
      { input: 'abc\nabc', output: '3' },
      { input: 'abc\ndef', output: '0' },
      { input: 'aggtab\ngxtxayb', output: '4' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\n# 2D DP\nprint()`),
      javascript: js(`const [a, b] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Edit distance',
    slug: 'curr2-edit-distance',
    difficulty: 'hard',
    section: 'DP',
    topics: ['DP', 'Strings'],
    description:
      'Read two lines: strings a and b (each length 1..500). Print the minimum number of insertions, deletions, or substitutions needed to convert a to b.',
    examples: [{ input: 'horse\nros', output: '3' }],
    tests: [
      { input: 'horse\nros', output: '3' },
      { input: 'intention\nexecution', output: '5' },
      { input: 'abc\nabc', output: '0' },
      { input: '\na', output: '1' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n") if "\\n" in data else (data, "")\nprint()`),
      javascript: js(`const [a = '', b = ''] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Longest substring without repeating chars',
    slug: 'curr2-longest-uniq-substr',
    difficulty: 'medium',
    section: 'Strings',
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    description:
      'Read a string. Print the length of the longest substring containing no repeated characters.',
    examples: [{ input: 'abcabcbb', output: '3' }],
    tests: [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
      { input: 'pwwkew', output: '3' },
      { input: '', output: '0' },
    ],
    starters: s_oneString('Sliding window with last-seen map'),
  }),
  E({
    title: 'Valid palindrome (alnum only)',
    slug: 'curr2-valid-pal-alnum',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings', 'Two Pointers'],
    description:
      'Read a string. Ignoring non-alphanumeric chars and case, print "Yes" if it reads the same forwards and backwards, else "No".',
    examples: [{ input: 'A man, a plan, a canal: Panama', output: 'Yes' }],
    tests: [
      { input: 'A man, a plan, a canal: Panama', output: 'Yes' },
      { input: 'race a car', output: 'No' },
      { input: ' ', output: 'Yes' },
    ],
    starters: s_oneString('Filter to alnum, lowercase, compare reversed'),
  }),
  E({
    title: 'Count substring occurrences',
    slug: 'curr2-count-substring',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Two lines: text t and pattern p. Print how many times p appears in t (overlapping allowed).',
    examples: [{ input: 'ababab\nab', output: '3' }],
    tests: [
      { input: 'ababab\nab', output: '3' },
      { input: 'aaaaa\naa', output: '4' },
      { input: 'hello\nworld', output: '0' },
    ],
    starters: {
      python: py(`t, p = data.split("\\n")\nprint()`),
      javascript: js(`const [t, p] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Run-length encoding',
    slug: 'curr2-rle-encode',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Read a lowercase string. Print its run-length encoding (e.g. "aaabbc" -> "a3b2c1"). Empty input -> empty output.',
    examples: [{ input: 'aaabbc', output: 'a3b2c1' }],
    tests: [
      { input: 'aaabbc', output: 'a3b2c1' },
      { input: 'abcd', output: 'a1b1c1d1' },
      { input: 'zzzz', output: 'z4' },
    ],
    starters: s_oneString('Walk + counter'),
  }),
  E({
    title: 'String multiply',
    slug: 'curr2-string-multiply',
    difficulty: 'medium',
    section: 'Strings',
    topics: ['Strings', 'Math'],
    description:
      'Read two non-negative integers as strings (one per line, up to 200 digits). Print their product as a string. Do not use big-int conversions of the inputs directly.',
    examples: [{ input: '123\n456', output: '56088' }],
    tests: [
      { input: '123\n456', output: '56088' },
      { input: '0\n12345', output: '0' },
      { input: '99\n99', output: '9801' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\n# Digit-by-digit\nprint()`),
      javascript: js(`const [a, b] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Compress whitespace',
    slug: 'curr2-compress-ws',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read a line. Collapse any run of whitespace into a single space and trim ends.',
    examples: [{ input: '  hello   world   ', output: 'hello world' }],
    tests: [
      { input: '  hello   world   ', output: 'hello world' },
      { input: 'a b c', output: 'a b c' },
      { input: '   ', output: '' },
    ],
    starters: s_oneString('Split + filter empties + join'),
  }),

  // ===== Dynamic programming (10) =====
  E({
    title: 'Climbing stairs',
    slug: 'curr2-climbing-stairs',
    difficulty: 'easy',
    section: 'DP',
    topics: ['DP', 'Math'],
    description:
      'Read N (1..40). Print the number of distinct ways to climb a staircase taking 1 or 2 steps at a time.',
    examples: [{ input: '5', output: '8' }],
    tests: [
      { input: '1', output: '1' },
      { input: '2', output: '2' },
      { input: '5', output: '8' },
      { input: '10', output: '89' },
    ],
    starters: s_oneInt('Fibonacci-like recurrence'),
  }),
  E({
    title: 'Coin change min coins',
    slug: 'curr2-coin-change',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Greedy'],
    description:
      'Line 1: amount A (0..5000). Line 2: K then K coin denominations. Print the minimum number of coins that sum to A, or -1 if impossible.',
    examples: [{ input: '11\n3 1 2 5', output: '3' }],
    tests: [
      { input: '11\n3 1 2 5', output: '3' },
      { input: '3\n1 2', output: '2' },
      { input: '7\n2 4', output: '-1' },
      { input: '0\n3 1 2 5', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\namount = int(lines[0])\nparts = list(map(int, lines[1].split()))\nk, coins = parts[0], parts[1:]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst amount = parseInt(lines[0], 10);\nconst parts = lines[1].split(/\\s+/).map(Number);\nconst k = parts[0]; const coins = parts.slice(1);\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Longest increasing subsequence',
    slug: 'curr2-lis-length',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Binary Search'],
    description:
      'Read N then N integers. Print the length of the longest strictly-increasing subsequence.',
    examples: [{ input: '8\n10 9 2 5 3 7 101 18', output: '4' }],
    tests: [
      { input: '8\n10 9 2 5 3 7 101 18', output: '4' },
      { input: '6\n0 1 0 3 2 3', output: '4' },
      { input: '5\n5 4 3 2 1', output: '1' },
    ],
    starters: s_intArrayFirstLineN('Patience sort'),
  }),
  E({
    title: '0/1 knapsack max value',
    slug: 'curr2-knapsack',
    difficulty: 'hard',
    section: 'DP',
    topics: ['DP'],
    description:
      'Line 1: N capacity W (1..200, 1..1000). Lines 2..N+1: each "weight value". Maximize value with total weight ≤ W. Each item used at most once.',
    examples: [{ input: '3 50\n10 60\n20 100\n30 120', output: '220' }],
    tests: [
      { input: '3 50\n10 60\n20 100\n30 120', output: '220' },
      { input: '1 1\n2 5', output: '0' },
      { input: '2 10\n5 10\n5 10', output: '20' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn, W = map(int, lines[0].split())\nitems = [tuple(map(int, l.split())) for l in lines[1:n+1]]\n# 2D DP\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [n, W] = lines[0].split(/\\s+/).map(Number);\nconst items = lines.slice(1, n + 1).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'House robber',
    slug: 'curr2-house-robber',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP'],
    description:
      'Read N then N non-negative ints (houses). Print max amount robbable without choosing two adjacent.',
    examples: [{ input: '4\n1 2 3 1', output: '4' }],
    tests: [
      { input: '4\n1 2 3 1', output: '4' },
      { input: '4\n2 7 9 3 1', output: '12' },
      { input: '1\n5', output: '5' },
    ],
    starters: s_intArrayFirstLineN('Two-rolling DP'),
  }),
  E({
    title: 'Unique paths grid',
    slug: 'curr2-unique-paths',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Math'],
    description:
      'Read m and n on one line. Count distinct paths from top-left to bottom-right of an m×n grid moving only right or down.',
    examples: [{ input: '3 7', output: '28' }],
    tests: [
      { input: '3 7', output: '28' },
      { input: '3 2', output: '3' },
      { input: '1 1', output: '1' },
    ],
    starters: s_twoInt('C(m+n-2, m-1)'),
  }),
  E({
    title: 'Min path sum',
    slug: 'curr2-min-path-sum',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP'],
    description:
      'Line 1: R C. Then R lines of C integers. Find min path sum from top-left to bottom-right (move only down or right).',
    examples: [{ input: '3 3\n1 3 1\n1 5 1\n4 2 1', output: '7' }],
    tests: [
      { input: '3 3\n1 3 1\n1 5 1\n4 2 1', output: '7' },
      { input: '2 3\n1 2 3\n4 5 6', output: '12' },
      { input: '1 1\n5', output: '5' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nr, c = map(int, lines[0].split())\ngrid = [list(map(int, lines[i+1].split())) for i in range(r)]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [r, c] = lines[0].split(/\\s+/).map(Number);\nconst grid = lines.slice(1, 1 + r).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Decode ways',
    slug: 'curr2-decode-ways',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Strings'],
    description:
      'Read a digit string (1..100 chars). Each digit pair 10..26 decodes to a letter A-Z (1->A, 26->Z). Print the number of decodings.',
    examples: [{ input: '226', output: '3' }],
    tests: [
      { input: '12', output: '2' },
      { input: '226', output: '3' },
      { input: '06', output: '0' },
      { input: '11106', output: '2' },
    ],
    starters: s_oneString('DP on prefixes'),
  }),
  E({
    title: 'Maximum subarray sum',
    slug: 'curr2-kadane',
    difficulty: 'easy',
    section: 'DP',
    topics: ['DP', 'Arrays'],
    description:
      'Read N then N integers (may be negative). Print the maximum contiguous-subarray sum.',
    examples: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' }],
    tests: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' },
      { input: '1\n1', output: '1' },
      { input: '5\n-1 -2 -3 -4 -5', output: '-1' },
    ],
    starters: s_intArrayFirstLineN('Kadane'),
  }),
  E({
    title: 'Word break feasibility',
    slug: 'curr2-word-break',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Strings', 'Hashing'],
    description:
      'Line 1: string s. Line 2: K dictionary words (space-separated). Print "Yes" if s can be segmented into a sequence of dictionary words, else "No".',
    examples: [{ input: 'leetcode\nleet code', output: 'Yes' }],
    tests: [
      { input: 'leetcode\nleet code', output: 'Yes' },
      { input: 'applepenapple\napple pen', output: 'Yes' },
      { input: 'catsandog\ncats dog sand and cat', output: 'No' },
    ],
    starters: {
      python: py(`s, dictLine = data.split("\\n")\nwords = set(dictLine.split())\nprint()`),
      javascript: js(
        `const [s, dictLine] = data.split(/\\n/);\nconst words = new Set(dictLine.split(/\\s+/));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),

  // ===== Graph / tree (10) =====
  E({
    title: 'BFS shortest path on grid',
    slug: 'curr2-grid-bfs',
    difficulty: 'medium',
    section: 'Graphs',
    topics: ['BFS', 'Graphs'],
    description:
      'Line 1: R C. Then R lines of C chars (.=open, #=wall). Top-left is start, bottom-right is goal. Print the length of the shortest 4-way path, or -1 if unreachable.',
    examples: [{ input: '3 3\n.#.\n.#.\n...', output: '4' }],
    tests: [
      { input: '3 3\n.#.\n.#.\n...', output: '4' },
      { input: '1 1\n.', output: '0' },
      { input: '2 2\n.#\n#.', output: '-1' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nr, c = map(int, lines[0].split())\ngrid = [lines[i+1] for i in range(r)]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [r, c] = lines[0].split(/\\s+/).map(Number);\nconst grid = lines.slice(1, 1 + r);\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Number of islands',
    slug: 'curr2-num-islands',
    difficulty: 'medium',
    section: 'Graphs',
    topics: ['DFS', 'BFS', 'Graphs'],
    description:
      'Line 1: R C. Then R lines of 0/1 chars (1=land). Print the number of 4-connected island components.',
    examples: [{ input: '4 5\n11110\n11010\n11000\n00000', output: '1' }],
    tests: [
      { input: '4 5\n11110\n11010\n11000\n00000', output: '1' },
      { input: '4 5\n11000\n11000\n00100\n00011', output: '3' },
      { input: '1 1\n0', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nr, c = map(int, lines[0].split())\ngrid = [list(lines[i+1]) for i in range(r)]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [r, c] = lines[0].split(/\\s+/).map(Number);\nconst grid = lines.slice(1, 1 + r).map(l => l.split(''));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Detect cycle in directed graph',
    slug: 'curr2-cycle-directed',
    difficulty: 'medium',
    section: 'Graphs',
    topics: ['DFS', 'Graphs', 'Topological Sort'],
    description:
      'Line 1: V E. Then E lines "u v" (0-indexed directed edges). Print "Yes" if the graph has a cycle, else "No".',
    examples: [{ input: '3 3\n0 1\n1 2\n2 0', output: 'Yes' }],
    tests: [
      { input: '3 3\n0 1\n1 2\n2 0', output: 'Yes' },
      { input: '3 2\n0 1\n1 2', output: 'No' },
      { input: '1 0', output: 'No' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nv, e = map(int, lines[0].split())\nedges = [tuple(map(int, l.split())) for l in lines[1:e+1]]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [v, e] = lines[0].split(/\\s+/).map(Number);\nconst edges = lines.slice(1, 1 + e).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Topological order valid?',
    slug: 'curr2-topo-valid',
    difficulty: 'medium',
    section: 'Graphs',
    topics: ['Topological Sort', 'Graphs'],
    description:
      'Line 1: V E. Then E lines "u v" of directed edges. Print "Yes" if a topological order exists (DAG), else "No".',
    examples: [{ input: '4 4\n0 1\n0 2\n1 3\n2 3', output: 'Yes' }],
    tests: [
      { input: '4 4\n0 1\n0 2\n1 3\n2 3', output: 'Yes' },
      { input: '3 3\n0 1\n1 2\n2 0', output: 'No' },
      { input: '2 0', output: 'Yes' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nv, e = map(int, lines[0].split())\nedges = [tuple(map(int, l.split())) for l in lines[1:e+1]]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [v, e] = lines[0].split(/\\s+/).map(Number);\nconst edges = lines.slice(1, 1 + e).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Connected components (undirected)',
    slug: 'curr2-components',
    difficulty: 'easy',
    section: 'Graphs',
    topics: ['DFS', 'BFS', 'Graphs'],
    description:
      'Line 1: V E. Then E lines "u v" of undirected edges (0-indexed). Print the number of connected components.',
    examples: [{ input: '5 3\n0 1\n1 2\n3 4', output: '2' }],
    tests: [
      { input: '5 3\n0 1\n1 2\n3 4', output: '2' },
      { input: '4 0', output: '4' },
      { input: '3 3\n0 1\n1 2\n0 2', output: '1' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nv, e = map(int, lines[0].split())\nedges = [tuple(map(int, l.split())) for l in lines[1:e+1]]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [v, e] = lines[0].split(/\\s+/).map(Number);\nconst edges = lines.slice(1, 1 + e).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Valid parentheses',
    slug: 'curr2-valid-parens',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Stack', 'Strings'],
    description: 'Read a string of (){}[]. Print "Yes" if it is balanced/well-nested, else "No".',
    examples: [{ input: '()[]{}', output: 'Yes' }],
    tests: [
      { input: '()[]{}', output: 'Yes' },
      { input: '(]', output: 'No' },
      { input: '([)]', output: 'No' },
      { input: '{[]}', output: 'Yes' },
    ],
    starters: s_oneString('Stack'),
  }),
  E({
    title: 'Min stack — get min',
    slug: 'curr2-min-stack',
    difficulty: 'medium',
    section: 'Design',
    topics: ['Stack', 'Design'],
    description:
      'Read N operations (one per line). Each is one of: "push X", "pop", "min". For each "min" op, print the current minimum on its own line. If "pop" or "min" runs on an empty stack, print "empty".',
    examples: [{ input: '5\npush 3\npush 1\nmin\npop\nmin', output: '1\n3' }],
    tests: [
      { input: '5\npush 3\npush 1\nmin\npop\nmin', output: '1\n3' },
      { input: '3\nmin\npush 7\nmin', output: 'empty\n7' },
      { input: '2\npop\nmin', output: 'empty\nempty' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")\nn = int(lines[0])\nops = lines[1:n+1]\nprint()`),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst ops = lines.slice(1, n + 1);\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Tree max depth (parent array)',
    slug: 'curr2-tree-depth',
    difficulty: 'easy',
    section: 'Trees',
    topics: ['Trees', 'DFS'],
    description:
      'Read N then a line with N integers: parent[i] for each node (parent[root] = -1). Print the maximum depth (root has depth 1).',
    examples: [{ input: '5\n-1 0 0 1 1', output: '3' }],
    tests: [
      { input: '5\n-1 0 0 1 1', output: '3' },
      { input: '1\n-1', output: '1' },
      { input: '4\n-1 0 1 2', output: '4' },
    ],
    starters: s_intArrayFirstLineN('Memoized depth(i)'),
  }),
  E({
    title: 'Binary tree level count (heap-array)',
    slug: 'curr2-heap-levels',
    difficulty: 'easy',
    section: 'Trees',
    topics: ['Trees', 'Math'],
    description:
      'Read N (>=1). N nodes stored as a complete binary tree (heap-array form: root index 0). Print the number of levels.',
    examples: [{ input: '7', output: '3' }],
    tests: [
      { input: '1', output: '1' },
      { input: '7', output: '3' },
      { input: '10', output: '4' },
    ],
    starters: s_oneInt('floor(log2(n))+1'),
  }),
  E({
    title: 'Connected component sizes (sorted)',
    slug: 'curr2-component-sizes',
    difficulty: 'medium',
    section: 'Graphs',
    topics: ['DFS', 'Graphs'],
    description:
      'Line 1: V E. Then E lines "u v" undirected. Print the sizes of all connected components in ascending order, space-separated.',
    examples: [{ input: '6 3\n0 1\n2 3\n3 4', output: '1 2 3' }],
    tests: [
      { input: '6 3\n0 1\n2 3\n3 4', output: '1 2 3' },
      { input: '3 0', output: '1 1 1' },
      { input: '4 4\n0 1\n1 2\n2 0\n3 3', output: '1 3' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nv, e = map(int, lines[0].split())\nedges = [tuple(map(int, l.split())) for l in lines[1:e+1]]\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [v, e] = lines[0].split(/\\s+/).map(Number);\nconst edges = lines.slice(1, 1 + e).map(l => l.split(/\\s+/).map(Number));\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),

  // ===== Number theory & math (10) =====
  E({
    title: 'GCD of two numbers',
    slug: 'curr2-gcd',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read two non-negative ints a b. Print gcd(a, b). gcd(0,0) = 0.',
    examples: [{ input: '12 18', output: '6' }],
    tests: [
      { input: '12 18', output: '6' },
      { input: '17 5', output: '1' },
      { input: '0 0', output: '0' },
      { input: '0 7', output: '7' },
    ],
    starters: s_twoInt('Euclid'),
  }),
  E({
    title: 'LCM of two numbers',
    slug: 'curr2-lcm',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read two positive ints a b. Print lcm(a, b).',
    examples: [{ input: '4 6', output: '12' }],
    tests: [
      { input: '4 6', output: '12' },
      { input: '7 3', output: '21' },
      { input: '10 10', output: '10' },
    ],
    starters: s_twoInt('a / gcd * b'),
  }),
  E({
    title: 'Sieve of Eratosthenes — primes up to N',
    slug: 'curr2-sieve',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (2..200000). Print the count of primes ≤ N.',
    examples: [{ input: '10', output: '4' }],
    tests: [
      { input: '10', output: '4' },
      { input: '2', output: '1' },
      { input: '20', output: '8' },
      { input: '100', output: '25' },
    ],
    starters: s_oneInt('Linear sieve'),
  }),
  E({
    title: 'Modular exponentiation',
    slug: 'curr2-modpow',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read a, b, m on one line. Print a^b mod m. (0 ≤ a, b ≤ 10^9, 1 ≤ m ≤ 10^9.)',
    examples: [{ input: '3 7 5', output: '2' }],
    tests: [
      { input: '3 7 5', output: '2' },
      { input: '2 10 1000', output: '24' },
      { input: '0 0 7', output: '1' },
      { input: '5 0 11', output: '1' },
    ],
    starters: {
      python: py(`a, b, m = map(int, data.split())\nprint(pow(a, b, m))`),
      javascript: js(`const [a, b, m] = data.split(/\\s+/).map(BigInt);\nconsole.log("");`),
      c: cMain(
        `    long long a, b, m;\n    scanf("%lld %lld %lld", &a, &b, &m);\n    /* TODO */\n    printf("\\n");`,
      ),
      cpp: cppMain(
        `    long long a, b, m;\n    cin >> a >> b >> m;\n    /* TODO */\n    cout << endl;`,
      ),
      java: javaMain(
        `        long a = sc.nextLong(), b = sc.nextLong(), m = sc.nextLong();\n        /* TODO */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Trailing zeros of N!',
    slug: 'curr2-trailing-zeros',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (0..10^9). Print the number of trailing zeros in N!.',
    examples: [{ input: '10', output: '2' }],
    tests: [
      { input: '10', output: '2' },
      { input: '0', output: '0' },
      { input: '5', output: '1' },
      { input: '25', output: '6' },
    ],
    starters: s_oneInt('Count factors of 5'),
  }),
  E({
    title: 'Power of two?',
    slug: 'curr2-is-pow2',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation', 'Math'],
    description: 'Read N (>= 0). Print "Yes" if N is a power of 2 (1, 2, 4, 8, ...), else "No".',
    examples: [{ input: '16', output: 'Yes' }],
    tests: [
      { input: '1', output: 'Yes' },
      { input: '16', output: 'Yes' },
      { input: '0', output: 'No' },
      { input: '24', output: 'No' },
    ],
    starters: s_oneInt('n>0 && (n & (n-1)) == 0'),
  }),
  E({
    title: 'Count set bits',
    slug: 'curr2-popcount',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation'],
    description: 'Read N (0..10^9). Print the number of 1 bits in its binary representation.',
    examples: [{ input: '13', output: '3' }],
    tests: [
      { input: '13', output: '3' },
      { input: '0', output: '0' },
      { input: '1023', output: '10' },
    ],
    starters: s_oneInt('Brian Kernighan'),
  }),
  E({
    title: 'XOR of range [L, R]',
    slug: 'curr2-xor-range',
    difficulty: 'medium',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation', 'Math'],
    description: 'Read L and R on one line (0 ≤ L ≤ R ≤ 10^9). Print L^(L+1)^...^R.',
    examples: [{ input: '5 7', output: '3' }],
    tests: [
      { input: '5 7', output: '3' },
      { input: '0 0', output: '0' },
      { input: '1 4', output: '4' },
    ],
    starters: s_twoInt('prefix xor depends on n%4'),
  }),
  E({
    title: 'Pow(x, n) double',
    slug: 'curr2-pow-double',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description:
      'Read x (a real number) and integer n on one line. Print x^n rounded to 5 decimal places.',
    examples: [{ input: '2.00000 10', output: '1024.00000' }],
    tests: [
      { input: '2.00000 10', output: '1024.00000' },
      { input: '2.10000 3', output: '9.26100' },
      { input: '2.00000 -2', output: '0.25000' },
    ],
    starters: {
      python: py(
        `parts = data.split()\nx = float(parts[0])\nn = int(parts[1])\nprint(f"{x ** n:.5f}")`,
      ),
      javascript: js(
        `const [a, b] = data.split(/\\s+/);\nconst x = parseFloat(a); const n = parseInt(b, 10);\nconsole.log(Math.pow(x, n).toFixed(5));`,
      ),
      c: cMain(
        `    double x; int n;\n    scanf("%lf %d", &x, &n);\n    printf("%.5f\\n", pow(x, n));`,
      ),
      cpp: cppMain(
        `    double x; int n;\n    cin >> x >> n;\n    cout << fixed << setprecision(5) << pow(x, n) << endl;`,
      ),
      java: javaMain(
        `        double x = sc.nextDouble(); int n = sc.nextInt();\n        System.out.printf("%.5f%n", Math.pow(x, n));`,
      ),
    },
  }),
  E({
    title: 'Number of digits (base 10)',
    slug: 'curr2-digit-count',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (>=0). Print the number of base-10 digits in N. (0 has 1 digit.)',
    examples: [{ input: '12345', output: '5' }],
    tests: [
      { input: '12345', output: '5' },
      { input: '0', output: '1' },
      { input: '9', output: '1' },
      { input: '1000000', output: '7' },
    ],
    starters: s_oneInt('floor(log10(n))+1'),
  }),
];
