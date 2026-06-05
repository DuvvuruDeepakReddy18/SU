// Phase 4 curriculum extension: 30 more universal-language exercises.
// Math/number-theory, sliding-window arrays, classic DP, greedy, and bit tricks.
// Generated with verified outputs (see build-curriculum-v3.mjs); same shape as
// curriculum-data.ts so the seeder picks them up via concatenation.

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

export const CURRICULUM_V3: Exercise[] = [
  E({
    title: 'Greatest common divisor',
    slug: 'curr3-gcd',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math', 'Number Theory'],
    description: 'Read two integers a and b (0 <= a,b <= 10^9). Print gcd(a, b).',
    examples: [{ input: '12 18', output: '6' }],
    tests: [
      { input: '12 18', output: '6' },
      { input: '17 5', output: '1' },
      { input: '100 100', output: '100' },
      { input: '0 5', output: '5' },
    ],
    starters: s_twoInt('Euclidean algorithm'),
  }),
  E({
    title: 'Least common multiple',
    slug: 'curr3-lcm',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math', 'Number Theory'],
    description: 'Read two integers a and b (1 <= a,b <= 10^6). Print lcm(a, b).',
    examples: [{ input: '4 6', output: '12' }],
    tests: [
      { input: '4 6', output: '12' },
      { input: '3 5', output: '15' },
      { input: '12 18', output: '36' },
      { input: '7 7', output: '7' },
    ],
    starters: s_twoInt('lcm = a / gcd(a,b) * b'),
  }),
  E({
    title: 'Count divisors',
    slug: 'curr3-count-divisors',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read an integer n (1 <= n <= 10^9). Print how many positive divisors n has.',
    examples: [{ input: '12', output: '6' }],
    tests: [
      { input: '12', output: '6' },
      { input: '1', output: '1' },
      { input: '16', output: '5' },
      { input: '7', output: '2' },
    ],
    starters: s_oneInt('Loop to sqrt(n)'),
  }),
  E({
    title: 'Sum of divisors',
    slug: 'curr3-sum-divisors',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read an integer n (1 <= n <= 10^6). Print the sum of all positive divisors of n.',
    examples: [{ input: '6', output: '12' }],
    tests: [
      { input: '6', output: '12' },
      { input: '12', output: '28' },
      { input: '1', output: '1' },
      { input: '10', output: '18' },
    ],
    starters: s_oneInt('Loop to sqrt(n), add both i and n/i'),
  }),
  E({
    title: 'Primality test',
    slug: 'curr3-is-prime',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math', 'Number Theory'],
    description: 'Read an integer n (1 <= n <= 10^12). Print YES if n is prime, otherwise NO.',
    examples: [{ input: '7', output: 'YES' }],
    tests: [
      { input: '7', output: 'YES' },
      { input: '1', output: 'NO' },
      { input: '2', output: 'YES' },
      { input: '15', output: 'NO' },
      { input: '97', output: 'YES' },
    ],
    starters: s_oneInt('Trial division to sqrt(n); print YES/NO'),
  }),
  E({
    title: 'Nth Fibonacci number',
    slug: 'curr3-nth-fib',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math', 'DP'],
    description: 'Read n (1 <= n <= 90). Print the nth Fibonacci number where F(1)=1, F(2)=1.',
    examples: [{ input: '10', output: '55' }],
    tests: [
      { input: '1', output: '1' },
      { input: '2', output: '1' },
      { input: '10', output: '55' },
      { input: '7', output: '13' },
    ],
    starters: s_oneInt('Iterate; F(1)=F(2)=1'),
  }),
  E({
    title: 'Sum of digits',
    slug: 'curr3-digit-sum',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read a non-negative integer n (0 <= n <= 10^15). Print the sum of its digits.',
    examples: [{ input: '1234', output: '10' }],
    tests: [
      { input: '1234', output: '10' },
      { input: '9', output: '9' },
      { input: '1000000', output: '1' },
      { input: '999', output: '27' },
    ],
    starters: s_oneInt('Repeatedly mod 10'),
  }),
  E({
    title: 'Maximum subarray sum',
    slug: 'curr3-kadane',
    difficulty: 'medium',
    section: 'Arrays',
    topics: ['Arrays', 'DP', 'Kadane'],
    description:
      'Read n then n integers. Print the maximum sum of any non-empty contiguous subarray.',
    examples: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' }],
    tests: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' },
      { input: '1\n5', output: '5' },
      { input: '3\n-1 -2 -3', output: '-1' },
      { input: '4\n1 2 3 4', output: '10' },
    ],
    starters: s_intArrayFirstLineN("Kadane's algorithm"),
  }),
  E({
    title: 'Second largest element',
    slug: 'curr3-second-largest',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description:
      'Read n then n integers. Print the second largest DISTINCT value, or -1 if it does not exist.',
    examples: [{ input: '5\n3 1 4 1 5', output: '4' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '4' },
      { input: '4\n10 10 10 9', output: '9' },
      { input: '1\n5', output: '-1' },
      { input: '3\n5 5 5', output: '-1' },
    ],
    starters: s_intArrayFirstLineN('Track largest and second; print -1 if none'),
  }),
  E({
    title: 'Move zeroes to end',
    slug: 'curr3-move-zeroes',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays', 'Two Pointers'],
    description:
      'Read n then n integers. Move all zeroes to the end, keeping the order of non-zeroes. Print the result space-separated.',
    examples: [{ input: '5\n0 1 0 3 12', output: '1 3 12 0 0' }],
    tests: [
      { input: '5\n0 1 0 3 12', output: '1 3 12 0 0' },
      { input: '3\n0 0 0', output: '0 0 0' },
      { input: '4\n1 2 3 4', output: '1 2 3 4' },
    ],
    starters: s_intArrayFirstLineN('Stable partition; print space-separated'),
  }),
  E({
    title: 'Max consecutive ones',
    slug: 'curr3-max-ones',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays', 'Sliding Window'],
    description:
      'Read n then n integers (each 0 or 1). Print the length of the longest run of consecutive 1s.',
    examples: [{ input: '6\n1 1 0 1 1 1', output: '3' }],
    tests: [
      { input: '6\n1 1 0 1 1 1', output: '3' },
      { input: '3\n0 0 0', output: '0' },
      { input: '4\n1 1 1 1', output: '4' },
    ],
    starters: s_intArrayFirstLineN('Track current run of 1s'),
  }),
  E({
    title: 'Running maximum',
    slug: 'curr3-prefix-max',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays', 'Prefix'],
    description:
      'Read n then n integers. Print the running (prefix) maximum as a space-separated list.',
    examples: [{ input: '5\n1 3 2 5 4', output: '1 3 3 5 5' }],
    tests: [
      { input: '5\n1 3 2 5 4', output: '1 3 3 5 5' },
      { input: '3\n5 4 3', output: '5 5 5' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayFirstLineN('Carry the max so far'),
  }),
  E({
    title: 'Rotate array right by k',
    slug: 'curr3-rotate-k',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description:
      'First line: n and k. Second line: n integers. Print the array rotated right by k positions (space-separated).',
    examples: [{ input: '5 2\n1 2 3 4 5', output: '4 5 1 2 3' }],
    tests: [
      { input: '5 2\n1 2 3 4 5', output: '4 5 1 2 3' },
      { input: '3 0\n1 2 3', output: '1 2 3' },
      { input: '4 5\n1 2 3 4', output: '4 1 2 3' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n k", second line n ints
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n k", second line n ints
console.log("");`),
      c: cMain(`    /* first line "n k", second line n ints */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n k", second line n ints */
    cout << endl;`),
      java: javaMain(`        /* first line "n k", second line n ints */
        System.out.println();`),
    },
  }),
  E({
    title: 'Count pairs with given sum',
    slug: 'curr3-count-pairs',
    difficulty: 'medium',
    section: 'Arrays',
    topics: ['Arrays', 'Hashing'],
    description:
      'First line: n and target k. Second line: n integers. Print the number of index pairs (i<j) with a[i]+a[j] == k.',
    examples: [{ input: '5 6\n1 5 7 -1 5', output: '3' }],
    tests: [
      { input: '5 6\n1 5 7 -1 5', output: '3' },
      { input: '4 0\n0 0 0 0', output: '6' },
      { input: '3 10\n1 2 3', output: '0' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n k", second line n ints
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n k", second line n ints
console.log("");`),
      c: cMain(`    /* first line "n k", second line n ints */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n k", second line n ints */
    cout << endl;`),
      java: javaMain(`        /* first line "n k", second line n ints */
        System.out.println();`),
    },
  }),
  E({
    title: 'Longest subarray with sum k',
    slug: 'curr3-subarray-sum-k',
    difficulty: 'medium',
    section: 'Arrays',
    topics: ['Arrays', 'Sliding Window'],
    description:
      'First line: n and k. Second line: n POSITIVE integers. Print the length of the longest contiguous subarray summing to exactly k (0 if none).',
    examples: [{ input: '5 7\n2 3 1 2 4', output: '3' }],
    tests: [
      { input: '5 7\n2 3 1 2 4', output: '3' },
      { input: '4 3\n1 1 1 1', output: '3' },
      { input: '3 100\n1 2 3', output: '0' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n k", second line n positive ints
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n k", second line n positive ints
console.log("");`),
      c: cMain(`    /* first line "n k", second line n positive ints */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n k", second line n positive ints */
    cout << endl;`),
      java: javaMain(`        /* first line "n k", second line n positive ints */
        System.out.println();`),
    },
  }),
  E({
    title: 'Climbing stairs',
    slug: 'curr3-climb-stairs',
    difficulty: 'easy',
    section: 'DP',
    topics: ['DP'],
    description:
      'Read n (1 <= n <= 45). You can climb 1 or 2 steps at a time. Print the number of distinct ways to reach step n.',
    examples: [{ input: '5', output: '8' }],
    tests: [
      { input: '2', output: '2' },
      { input: '3', output: '3' },
      { input: '5', output: '8' },
      { input: '1', output: '1' },
    ],
    starters: s_oneInt('ways(n) = ways(n-1) + ways(n-2)'),
  }),
  E({
    title: 'House robber',
    slug: 'curr3-house-robber',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP'],
    description:
      'Read n then n integers (house values). Print the maximum total you can rob without taking two adjacent houses.',
    examples: [{ input: '4\n2 7 9 3', output: '11' }],
    tests: [
      { input: '4\n2 7 9 3', output: '11' },
      { input: '1\n5', output: '5' },
      { input: '3\n2 1 1', output: '3' },
      { input: '5\n2 7 9 3 1', output: '12' },
    ],
    starters: s_intArrayFirstLineN('dp = max(prev, prevprev + a[i])'),
  }),
  E({
    title: 'Coin change (min coins)',
    slug: 'curr3-coin-change-min',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Greedy'],
    description:
      'First line: n and amount. Second line: n coin denominations. Print the minimum number of coins to make amount, or -1 if impossible. (amount can be 0.)',
    examples: [{ input: '3 11\n1 2 5', output: '3' }],
    tests: [
      { input: '3 11\n1 2 5', output: '3' },
      { input: '1 3\n2', output: '-1' },
      { input: '2 6\n1 3', output: '2' },
      { input: '3 0\n1 2 5', output: '0' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n amount", second line n coin values
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n amount", second line n coin values
console.log("");`),
      c: cMain(`    /* first line "n amount", second line n coin values */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n amount", second line n coin values */
    cout << endl;`),
      java: javaMain(`        /* first line "n amount", second line n coin values */
        System.out.println();`),
    },
  }),
  E({
    title: 'Longest increasing subsequence',
    slug: 'curr3-lis',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Binary Search'],
    description:
      'Read n then n integers. Print the length of the longest STRICTLY increasing subsequence.',
    examples: [{ input: '6\n10 9 2 5 3 7', output: '3' }],
    tests: [
      { input: '6\n10 9 2 5 3 7', output: '3' },
      { input: '1\n1', output: '1' },
      { input: '4\n1 2 3 4', output: '4' },
      { input: '3\n3 2 1', output: '1' },
    ],
    starters: s_intArrayFirstLineN('Patience sorting / O(n log n)'),
  }),
  E({
    title: 'Edit distance',
    slug: 'curr3-edit-distance',
    difficulty: 'hard',
    section: 'DP',
    topics: ['DP', 'Strings'],
    description:
      'Read two lines: strings a and b (lowercase, length <= 1000). Print the minimum number of single-character insertions, deletions, or substitutions to turn a into b.',
    examples: [{ input: 'horse\nros', output: '3' }],
    tests: [
      { input: 'horse\nros', output: '3' },
      { input: 'intention\nexecution', output: '5' },
      { input: 'abc\nabc', output: '0' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# two lines: strings a and b
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// two lines: strings a and b
console.log("");`),
      c: cMain(`    /* two lines: strings a and b */
    printf("\\n");`),
      cpp: cppMain(`    /* two lines: strings a and b */
    cout << endl;`),
      java: javaMain(`        /* two lines: strings a and b */
        System.out.println();`),
    },
  }),
  E({
    title: '0/1 Knapsack',
    slug: 'curr3-knapsack',
    difficulty: 'hard',
    section: 'DP',
    topics: ['DP'],
    description:
      'First line: n items and capacity W. Next n lines: each has weight and value. Print the maximum total value of a subset of items whose weights sum to at most W.',
    examples: [{ input: '3 50\n10 60\n20 100\n30 120', output: '220' }],
    tests: [
      { input: '3 50\n10 60\n20 100\n30 120', output: '220' },
      { input: '1 5\n10 100', output: '0' },
      { input: '2 4\n1 1\n3 4', output: '5' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n W", then n lines "weight value"
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n W", then n lines "weight value"
console.log("");`),
      c: cMain(`    /* first line "n W", then n lines "weight value" */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n W", then n lines "weight value" */
    cout << endl;`),
      java: javaMain(`        /* first line "n W", then n lines "weight value" */
        System.out.println();`),
    },
  }),
  E({
    title: 'Maximum product subarray',
    slug: 'curr3-max-product-subarray',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Arrays'],
    description:
      'Read n then n integers. Print the maximum product of any non-empty contiguous subarray.',
    examples: [{ input: '4\n2 3 -2 4', output: '6' }],
    tests: [
      { input: '4\n2 3 -2 4', output: '6' },
      { input: '3\n-2 0 -1', output: '0' },
      { input: '2\n-2 -3', output: '6' },
      { input: '1\n-5', output: '-5' },
    ],
    starters: s_intArrayFirstLineN('Track running max and min (negatives flip)'),
  }),
  E({
    title: 'Minimum currency notes',
    slug: 'curr3-min-notes',
    difficulty: 'easy',
    section: 'Greedy',
    topics: ['Greedy'],
    description:
      'Read an amount (1 <= amount <= 10^7). Using Indian denominations [1,2,5,10,20,50,100,200,500,2000], print the minimum number of notes needed.',
    examples: [{ input: '2530', output: '4' }],
    tests: [
      { input: '70', output: '2' },
      { input: '1', output: '1' },
      { input: '2000', output: '1' },
      { input: '2530', output: '4' },
    ],
    starters: s_oneInt('Greedily take the largest note <= remaining'),
  }),
  E({
    title: 'Kth smallest element',
    slug: 'curr3-kth-smallest',
    difficulty: 'easy',
    section: 'Sorting',
    topics: ['Sorting'],
    description:
      'First line: n and k (1 <= k <= n). Second line: n integers. Print the kth smallest value (1-indexed, duplicates count).',
    examples: [{ input: '5 2\n3 1 4 1 5', output: '1' }],
    tests: [
      { input: '5 2\n3 1 4 1 5', output: '1' },
      { input: '3 3\n7 2 9', output: '9' },
      { input: '1 1\n5', output: '5' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n k", second line n ints
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n k", second line n ints
console.log("");`),
      c: cMain(`    /* first line "n k", second line n ints */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n k", second line n ints */
    cout << endl;`),
      java: javaMain(`        /* first line "n k", second line n ints */
        System.out.println();`),
    },
  }),
  E({
    title: 'Count inversions',
    slug: 'curr3-count-inversions',
    difficulty: 'medium',
    section: 'Sorting',
    topics: ['Sorting', 'Divide and Conquer'],
    description:
      'Read n then n integers. Print the number of inversions: pairs (i<j) with a[i] > a[j].',
    examples: [{ input: '5\n2 4 1 3 5', output: '3' }],
    tests: [
      { input: '5\n2 4 1 3 5', output: '3' },
      { input: '3\n3 2 1', output: '3' },
      { input: '4\n1 2 3 4', output: '0' },
    ],
    starters: s_intArrayFirstLineN('Merge sort and count, or O(n^2) for small n'),
  }),
  E({
    title: 'Merge two sorted arrays',
    slug: 'curr3-merge-sorted',
    difficulty: 'easy',
    section: 'Sorting',
    topics: ['Two Pointers', 'Sorting'],
    description:
      'First line: n and m. Second line: n sorted integers. Third line: m sorted integers. Print the merged sorted array (space-separated).',
    examples: [{ input: '3 3\n1 3 5\n2 4 6', output: '1 2 3 4 5 6' }],
    tests: [
      { input: '3 3\n1 3 5\n2 4 6', output: '1 2 3 4 5 6' },
      { input: '2 1\n1 2\n3', output: '1 2 3' },
      { input: '1 1\n5\n1', output: '1 5' },
    ],
    starters: {
      python: py(`lines = data.split("\\n")
# first line "n m", second line n ints, third line m ints
print()`),
      javascript: js(`const lines = data.split(/\\n/);
// first line "n m", second line n ints, third line m ints
console.log("");`),
      c: cMain(`    /* first line "n m", second line n ints, third line m ints */
    printf("\\n");`),
      cpp: cppMain(`    /* first line "n m", second line n ints, third line m ints */
    cout << endl;`),
      java: javaMain(`        /* first line "n m", second line n ints, third line m ints */
        System.out.println();`),
    },
  }),
  E({
    title: 'Valid parentheses',
    slug: 'curr3-valid-parens',
    difficulty: 'easy',
    section: 'Stacks',
    topics: ['Stacks', 'Strings'],
    description:
      'Read a string of the characters ()[]{}. Print YES if every bracket is correctly matched and nested, else NO.',
    examples: [{ input: '()[]{}', output: 'YES' }],
    tests: [
      { input: '()[]{}', output: 'YES' },
      { input: '(]', output: 'NO' },
      { input: '([{}])', output: 'YES' },
      { input: '((', output: 'NO' },
    ],
    starters: s_oneString('Push opens, match closes off a stack'),
  }),
  E({
    title: 'Reverse word order',
    slug: 'curr3-reverse-words',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Read a line of words separated by single spaces. Print the words in reverse order.',
    examples: [{ input: 'the sky is blue', output: 'blue is sky the' }],
    tests: [
      { input: 'the sky is blue', output: 'blue is sky the' },
      { input: 'hello', output: 'hello' },
      { input: 'a b c d', output: 'd c b a' },
    ],
    starters: s_oneString('Split on spaces, reverse, join'),
  }),
  E({
    title: 'Count set bits',
    slug: 'curr3-count-set-bits',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation'],
    description:
      'Read a non-negative integer n (0 <= n <= 10^9). Print the number of 1-bits in its binary representation.',
    examples: [{ input: '7', output: '3' }],
    tests: [
      { input: '7', output: '3' },
      { input: '0', output: '0' },
      { input: '255', output: '8' },
      { input: '1024', output: '1' },
    ],
    starters: s_oneInt('n &= (n-1) trick, or shift and mask'),
  }),
  E({
    title: 'Power of two',
    slug: 'curr3-power-of-two',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation', 'Math'],
    description: 'Read an integer n (1 <= n <= 10^9). Print YES if n is a power of two, else NO.',
    examples: [{ input: '8', output: 'YES' }],
    tests: [
      { input: '8', output: 'YES' },
      { input: '6', output: 'NO' },
      { input: '1', output: 'YES' },
      { input: '1024', output: 'YES' },
    ],
    starters: s_oneInt('n > 0 and (n & (n-1)) == 0'),
  }),
];
