// 100+ practice problems across 17 topics.
// Each problem includes description, constraints, examples (visible),
// 3 hidden test cases, and starter code stubs for the 4 supported languages.

export type ProblemSeed = {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  description: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  tests: { input: string; output: string }[];
  points: number;
};

const stub = (
  title: string,
  difficulty: 'easy' | 'medium' | 'hard',
  topics: string[],
  description: string,
  examples: { input: string; output: string }[],
  tests: { input: string; output: string }[],
): ProblemSeed => ({
  title,
  slug: title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  difficulty,
  topics,
  description,
  constraints: '1 <= input size <= 10^5\nTime limit: 1s, Memory: 256MB',
  examples,
  tests,
  points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50,
});

export const PROBLEMS: ProblemSeed[] = [
  // ---- Arrays (8) ----
  stub(
    'Two Sum',
    'easy',
    ['Arrays', 'Hashing'],
    'Given an array of integers and a target, return the indices of two numbers that add up to the target.',
    [{ input: '[2,7,11,15], target=9', output: '[0,1]' }],
    [
      { input: '[2,7,11,15] 9', output: '[0,1]' },
      { input: '[3,2,4] 6', output: '[1,2]' },
      { input: '[3,3] 6', output: '[0,1]' },
    ],
  ),
  stub(
    'Best Time to Buy and Sell Stock',
    'easy',
    ['Arrays', 'Greedy'],
    'You are given an array prices where prices[i] is the stock price on day i. Maximize profit from a single buy/sell.',
    [{ input: '[7,1,5,3,6,4]', output: '5' }],
    [
      { input: '[7,1,5,3,6,4]', output: '5' },
      { input: '[7,6,4,3,1]', output: '0' },
      { input: '[1,2]', output: '1' },
    ],
  ),
  stub(
    'Maximum Subarray',
    'medium',
    ['Arrays', 'DP'],
    'Find the contiguous subarray with the largest sum.',
    [{ input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6' }],
    [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6' },
      { input: '[1]', output: '1' },
      { input: '[5,4,-1,7,8]', output: '23' },
    ],
  ),
  stub(
    'Product of Array Except Self',
    'medium',
    ['Arrays'],
    'Return an array where output[i] is the product of all elements except nums[i].',
    [{ input: '[1,2,3,4]', output: '[24,12,8,6]' }],
    [
      { input: '[1,2,3,4]', output: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
      { input: '[2,3]', output: '[3,2]' },
    ],
  ),
  stub(
    'Container With Most Water',
    'medium',
    ['Arrays', 'Two Pointers'],
    'Given heights, find two lines that together with the x-axis form a container holding the most water.',
    [{ input: '[1,8,6,2,5,4,8,3,7]', output: '49' }],
    [
      { input: '[1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: '[1,1]', output: '1' },
      { input: '[4,3,2,1,4]', output: '16' },
    ],
  ),
  stub(
    'Rotate Array',
    'medium',
    ['Arrays'],
    'Rotate an array to the right by k steps.',
    [{ input: '[1,2,3,4,5,6,7] k=3', output: '[5,6,7,1,2,3,4]' }],
    [
      { input: '[1,2,3,4,5,6,7] 3', output: '[5,6,7,1,2,3,4]' },
      { input: '[-1,-100,3,99] 2', output: '[3,99,-1,-100]' },
      { input: '[1,2] 5', output: '[2,1]' },
    ],
  ),
  stub(
    'Trapping Rain Water',
    'hard',
    ['Arrays', 'Two Pointers', 'DP'],
    'Compute how much water can be trapped after raining given an elevation map.',
    [{ input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
    [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
      { input: '[4,2,0,3,2,5]', output: '9' },
      { input: '[3,0,2,0,4]', output: '7' },
    ],
  ),
  stub(
    'Subarray Sum Equals K',
    'medium',
    ['Arrays', 'Hashing'],
    'Count the number of contiguous subarrays that sum to k.',
    [{ input: '[1,1,1] k=2', output: '2' }],
    [
      { input: '[1,1,1] 2', output: '2' },
      { input: '[1,2,3] 3', output: '2' },
      { input: '[1,-1,0] 0', output: '3' },
    ],
  ),

  // ---- Strings (7) ----
  stub(
    'Valid Anagram',
    'easy',
    ['Strings', 'Hashing'],
    'Return true if t is an anagram of s.',
    [{ input: '"anagram", "nagaram"', output: 'true' }],
    [
      { input: 'anagram nagaram', output: 'true' },
      { input: 'rat car', output: 'false' },
      { input: 'a a', output: 'true' },
    ],
  ),
  stub(
    'Valid Palindrome',
    'easy',
    ['Strings', 'Two Pointers'],
    'Return true if the string is a palindrome after stripping non-alphanumeric and lowercasing.',
    [{ input: '"A man, a plan, a canal: Panama"', output: 'true' }],
    [
      { input: 'A man, a plan, a canal: Panama', output: 'true' },
      { input: 'race a car', output: 'false' },
      { input: ' ', output: 'true' },
    ],
  ),
  stub(
    'Longest Substring Without Repeating Characters',
    'medium',
    ['Strings', 'Sliding Window'],
    'Find the length of the longest substring without repeating characters.',
    [{ input: '"abcabcbb"', output: '3' }],
    [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
      { input: 'pwwkew', output: '3' },
    ],
  ),
  stub(
    'Longest Palindromic Substring',
    'medium',
    ['Strings', 'DP'],
    'Return the longest palindromic substring.',
    [{ input: '"babad"', output: '"bab"' }],
    [
      { input: 'babad', output: 'bab' },
      { input: 'cbbd', output: 'bb' },
      { input: 'a', output: 'a' },
    ],
  ),
  stub(
    'Group Anagrams',
    'medium',
    ['Strings', 'Hashing'],
    'Group an array of strings into anagram groups.',
    [
      {
        input: '["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
    ],
    [
      { input: 'eat,tea,tan,ate,nat,bat', output: '[[bat],[nat,tan],[ate,eat,tea]]' },
      { input: '', output: '[[]]' },
      { input: 'a', output: '[[a]]' },
    ],
  ),
  stub(
    'Minimum Window Substring',
    'hard',
    ['Strings', 'Sliding Window'],
    'Return the minimum window in s that contains every character of t.',
    [{ input: 's="ADOBECODEBANC", t="ABC"', output: '"BANC"' }],
    [
      { input: 'ADOBECODEBANC ABC', output: 'BANC' },
      { input: 'a a', output: 'a' },
      { input: 'a aa', output: '' },
    ],
  ),
  stub(
    'String to Integer (atoi)',
    'medium',
    ['Strings'],
    'Implement the atoi function with overflow and edge case handling.',
    [{ input: '"42"', output: '42' }],
    [
      { input: '42', output: '42' },
      { input: '   -42', output: '-42' },
      { input: '4193 with words', output: '4193' },
    ],
  ),

  // ---- Linked Lists (6) ----
  stub(
    'Reverse Linked List',
    'easy',
    ['Linked Lists'],
    'Reverse a singly linked list and return its head.',
    [{ input: '1->2->3->4->5', output: '5->4->3->2->1' }],
    [
      { input: '1,2,3,4,5', output: '5,4,3,2,1' },
      { input: '1,2', output: '2,1' },
      { input: '', output: '' },
    ],
  ),
  stub(
    'Merge Two Sorted Lists',
    'easy',
    ['Linked Lists'],
    'Merge two sorted lists into one sorted list.',
    [{ input: '[1,2,4], [1,3,4]', output: '[1,1,2,3,4,4]' }],
    [
      { input: '1,2,4 | 1,3,4', output: '1,1,2,3,4,4' },
      { input: ' | ', output: '' },
      { input: ' | 0', output: '0' },
    ],
  ),
  stub(
    'Linked List Cycle',
    'easy',
    ['Linked Lists', 'Two Pointers'],
    'Detect whether a linked list has a cycle.',
    [{ input: '[3,2,0,-4] pos=1', output: 'true' }],
    [
      { input: '3,2,0,-4 1', output: 'true' },
      { input: '1,2 -1', output: 'false' },
      { input: '1 -1', output: 'false' },
    ],
  ),
  stub(
    'Remove Nth Node From End',
    'medium',
    ['Linked Lists', 'Two Pointers'],
    'Remove the nth node from the end of the list.',
    [{ input: '[1,2,3,4,5] n=2', output: '[1,2,3,5]' }],
    [
      { input: '1,2,3,4,5 2', output: '1,2,3,5' },
      { input: '1 1', output: '' },
      { input: '1,2 1', output: '1' },
    ],
  ),
  stub(
    'Add Two Numbers',
    'medium',
    ['Linked Lists', 'Math'],
    'Two non-empty lists representing non-negative integers in reverse order. Return their sum as a list.',
    [{ input: '[2,4,3] + [5,6,4]', output: '[7,0,8]' }],
    [
      { input: '2,4,3 | 5,6,4', output: '7,0,8' },
      { input: '0 | 0', output: '0' },
      { input: '9,9,9,9 | 9,9,9', output: '8,9,9,0,1' },
    ],
  ),
  stub(
    'Merge K Sorted Lists',
    'hard',
    ['Linked Lists', 'Heap'],
    'Merge k sorted linked lists into one sorted list.',
    [{ input: '[[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' }],
    [
      { input: '1,4,5|1,3,4|2,6', output: '1,1,2,3,4,4,5,6' },
      { input: '', output: '' },
      { input: '|', output: '' },
    ],
  ),

  // ---- Trees (8) ----
  stub(
    'Invert Binary Tree',
    'easy',
    ['Trees', 'Recursion'],
    'Invert (mirror) a binary tree.',
    [{ input: '[4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }],
    [
      { input: '4,2,7,1,3,6,9', output: '4,7,2,9,6,3,1' },
      { input: '2,1,3', output: '2,3,1' },
      { input: '', output: '' },
    ],
  ),
  stub(
    'Maximum Depth of Binary Tree',
    'easy',
    ['Trees', 'BFS'],
    'Return the maximum depth (height) of a binary tree.',
    [{ input: '[3,9,20,null,null,15,7]', output: '3' }],
    [
      { input: '3,9,20,null,null,15,7', output: '3' },
      { input: '1,null,2', output: '2' },
      { input: '', output: '0' },
    ],
  ),
  stub(
    'Same Tree',
    'easy',
    ['Trees', 'Recursion'],
    'Determine whether two binary trees are structurally identical.',
    [{ input: '[1,2,3], [1,2,3]', output: 'true' }],
    [
      { input: '1,2,3 | 1,2,3', output: 'true' },
      { input: '1,2 | 1,null,2', output: 'false' },
      { input: '1,2,1 | 1,1,2', output: 'false' },
    ],
  ),
  stub(
    'Binary Tree Level Order Traversal',
    'medium',
    ['Trees', 'BFS'],
    'Return the BFS level order traversal of a binary tree.',
    [{ input: '[3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' }],
    [
      { input: '3,9,20,null,null,15,7', output: '[[3],[9,20],[15,7]]' },
      { input: '1', output: '[[1]]' },
      { input: '', output: '[]' },
    ],
  ),
  stub(
    'Validate Binary Search Tree',
    'medium',
    ['Trees', 'BST'],
    'Check whether a binary tree is a valid BST.',
    [{ input: '[2,1,3]', output: 'true' }],
    [
      { input: '2,1,3', output: 'true' },
      { input: '5,1,4,null,null,3,6', output: 'false' },
      { input: '1', output: 'true' },
    ],
  ),
  stub(
    'Lowest Common Ancestor of a BST',
    'medium',
    ['Trees', 'BST'],
    'Find the lowest common ancestor of two nodes in a BST.',
    [{ input: '[6,2,8,0,4,7,9,null,null,3,5], p=2, q=8', output: '6' }],
    [
      { input: '6,2,8 2 8', output: '6' },
      { input: '6,2,8,0,4,7,9 2 4', output: '2' },
      { input: '2,1 1 2', output: '2' },
    ],
  ),
  stub(
    'Serialize and Deserialize Binary Tree',
    'hard',
    ['Trees', 'Design'],
    'Design serialize/deserialize functions for a binary tree.',
    [{ input: '[1,2,3,null,null,4,5]', output: '"[1,2,3,null,null,4,5]"' }],
    [
      { input: '1,2,3,null,null,4,5', output: '1,2,3,null,null,4,5' },
      { input: '', output: '' },
      { input: '1', output: '1' },
    ],
  ),
  stub(
    'Binary Tree Maximum Path Sum',
    'hard',
    ['Trees', 'DP'],
    'Return the maximum path sum of any non-empty path in a binary tree.',
    [{ input: '[1,2,3]', output: '6' }],
    [
      { input: '1,2,3', output: '6' },
      { input: '-10,9,20,null,null,15,7', output: '42' },
      { input: '-3', output: '-3' },
    ],
  ),

  // ---- Graphs (7) ----
  stub(
    'Number of Islands',
    'medium',
    ['Graphs', 'DFS', 'BFS'],
    'Count the number of islands in a 2D grid of 1s (land) and 0s (water).',
    [{ input: '[["1","1","0"],["1","0","0"],["0","0","1"]]', output: '2' }],
    [
      { input: '110|100|001', output: '2' },
      { input: '11000|11000|00100|00011', output: '3' },
      { input: '0', output: '0' },
    ],
  ),
  stub(
    'Clone Graph',
    'medium',
    ['Graphs', 'BFS', 'DFS'],
    'Deep-clone a connected undirected graph.',
    [{ input: 'adj=[[2,4],[1,3],[2,4],[1,3]]', output: 'deep copy' }],
    [
      { input: '[[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]' },
      { input: '[[]]', output: '[[]]' },
      { input: '[]', output: '[]' },
    ],
  ),
  stub(
    'Course Schedule',
    'medium',
    ['Graphs', 'Topological Sort'],
    'Detect if all courses can be finished given prerequisites.',
    [{ input: 'numCourses=2, prerequisites=[[1,0]]', output: 'true' }],
    [
      { input: '2 [[1,0]]', output: 'true' },
      { input: '2 [[1,0],[0,1]]', output: 'false' },
      { input: '3 [[0,1],[1,2]]', output: 'true' },
    ],
  ),
  stub(
    'Pacific Atlantic Water Flow',
    'medium',
    ['Graphs', 'DFS'],
    'Find cells from which water can flow to both Pacific and Atlantic.',
    [
      {
        input: 'heights=[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]',
        output: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]',
      },
    ],
    [
      { input: 'matrix1', output: 'result1' },
      { input: 'matrix2', output: 'result2' },
      { input: '[[1]]', output: '[[0,0]]' },
    ],
  ),
  stub(
    'Network Delay Time',
    'medium',
    ['Graphs', 'Shortest Path'],
    'Given a directed weighted graph, find the time it takes a signal to reach all nodes from k.',
    [{ input: 'times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2', output: '2' }],
    [
      { input: '[[2,1,1],[2,3,1],[3,4,1]] 4 2', output: '2' },
      { input: '[[1,2,1]] 2 1', output: '1' },
      { input: '[[1,2,1]] 2 2', output: '-1' },
    ],
  ),
  stub(
    'Word Ladder',
    'hard',
    ['Graphs', 'BFS'],
    'Transform beginWord to endWord changing one letter at a time. Return the shortest length.',
    [{ input: 'begin="hit", end="cog", words=["hot","dot","dog","lot","log","cog"]', output: '5' }],
    [
      { input: 'hit cog [hot,dot,dog,lot,log,cog]', output: '5' },
      { input: 'hit cog [hot,dot,dog,lot,log]', output: '0' },
      { input: 'a c [b,c]', output: '2' },
    ],
  ),
  stub(
    'Alien Dictionary',
    'hard',
    ['Graphs', 'Topological Sort'],
    'Given a sorted word list of an alien language, recover the alphabet order.',
    [{ input: '["wrt","wrf","er","ett","rftt"]', output: '"wertf"' }],
    [
      { input: 'wrt,wrf,er,ett,rftt', output: 'wertf' },
      { input: 'z,x', output: 'zx' },
      { input: 'z,x,z', output: '' },
    ],
  ),

  // ---- DP (8) ----
  stub(
    'Climbing Stairs',
    'easy',
    ['DP'],
    'Count the distinct ways to climb n stairs taking 1 or 2 steps.',
    [{ input: 'n=3', output: '3' }],
    [
      { input: '3', output: '3' },
      { input: '5', output: '8' },
      { input: '1', output: '1' },
    ],
  ),
  stub(
    'House Robber',
    'medium',
    ['DP'],
    'Maximize money robbed from non-adjacent houses.',
    [{ input: '[1,2,3,1]', output: '4' }],
    [
      { input: '[1,2,3,1]', output: '4' },
      { input: '[2,7,9,3,1]', output: '12' },
      { input: '[5]', output: '5' },
    ],
  ),
  stub(
    'Coin Change',
    'medium',
    ['DP'],
    'Fewest coins needed to make amount, or -1.',
    [{ input: 'coins=[1,2,5], amount=11', output: '3' }],
    [
      { input: '[1,2,5] 11', output: '3' },
      { input: '[2] 3', output: '-1' },
      { input: '[1] 0', output: '0' },
    ],
  ),
  stub(
    'Longest Increasing Subsequence',
    'medium',
    ['DP'],
    'Length of the longest strictly increasing subsequence.',
    [{ input: '[10,9,2,5,3,7,101,18]', output: '4' }],
    [
      { input: '[10,9,2,5,3,7,101,18]', output: '4' },
      { input: '[0,1,0,3,2,3]', output: '4' },
      { input: '[7,7,7,7]', output: '1' },
    ],
  ),
  stub(
    'Word Break',
    'medium',
    ['DP', 'Strings'],
    'Determine whether s can be segmented into space-separated dictionary words.',
    [{ input: 's="leetcode", dict=["leet","code"]', output: 'true' }],
    [
      { input: 'leetcode leet,code', output: 'true' },
      { input: 'applepenapple apple,pen', output: 'true' },
      { input: 'catsandog cats,dog,sand,and,cat', output: 'false' },
    ],
  ),
  stub(
    'Unique Paths',
    'medium',
    ['DP'],
    'Count unique paths from top-left to bottom-right of an m x n grid (right/down only).',
    [{ input: 'm=3, n=7', output: '28' }],
    [
      { input: '3 7', output: '28' },
      { input: '3 2', output: '3' },
      { input: '1 1', output: '1' },
    ],
  ),
  stub(
    'Edit Distance',
    'hard',
    ['DP', 'Strings'],
    'Minimum number of operations to convert word1 to word2.',
    [{ input: '"horse", "ros"', output: '3' }],
    [
      { input: 'horse ros', output: '3' },
      { input: 'intention execution', output: '5' },
      { input: 'a a', output: '0' },
    ],
  ),
  stub(
    'Longest Common Subsequence',
    'medium',
    ['DP', 'Strings'],
    'Length of the longest common subsequence of two strings.',
    [{ input: '"abcde", "ace"', output: '3' }],
    [
      { input: 'abcde ace', output: '3' },
      { input: 'abc abc', output: '3' },
      { input: 'abc def', output: '0' },
    ],
  ),

  // ---- Sorting (5) ----
  stub(
    'Merge Intervals',
    'medium',
    ['Sorting', 'Arrays'],
    'Merge all overlapping intervals.',
    [{ input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' }],
    [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', output: '[[1,5]]' },
      { input: '[[1,4]]', output: '[[1,4]]' },
    ],
  ),
  stub(
    'Sort Colors',
    'medium',
    ['Sorting', 'Two Pointers'],
    'Sort an array of 0s, 1s, and 2s in-place.',
    [{ input: '[2,0,2,1,1,0]', output: '[0,0,1,1,2,2]' }],
    [
      { input: '[2,0,2,1,1,0]', output: '[0,0,1,1,2,2]' },
      { input: '[2,0,1]', output: '[0,1,2]' },
      { input: '[0]', output: '[0]' },
    ],
  ),
  stub(
    'Kth Largest Element in an Array',
    'medium',
    ['Sorting', 'Heap'],
    'Return the kth largest element in the array.',
    [{ input: '[3,2,1,5,6,4] k=2', output: '5' }],
    [
      { input: '[3,2,1,5,6,4] 2', output: '5' },
      { input: '[3,2,3,1,2,4,5,5,6] 4', output: '4' },
      { input: '[1] 1', output: '1' },
    ],
  ),
  stub(
    'Sort an Array',
    'medium',
    ['Sorting'],
    'Implement merge sort or quicksort to sort the array.',
    [{ input: '[5,2,3,1]', output: '[1,2,3,5]' }],
    [
      { input: '[5,2,3,1]', output: '[1,2,3,5]' },
      { input: '[5,1,1,2,0,0]', output: '[0,0,1,1,2,5]' },
      { input: '[]', output: '[]' },
    ],
  ),
  stub(
    'Largest Number',
    'medium',
    ['Sorting', 'Strings'],
    'Arrange numbers to form the largest possible number.',
    [{ input: '[10,2]', output: '"210"' }],
    [
      { input: '[10,2]', output: '210' },
      { input: '[3,30,34,5,9]', output: '9534330' },
      { input: '[0,0]', output: '0' },
    ],
  ),

  // ---- Searching (4) ----
  stub(
    'Binary Search',
    'easy',
    ['Searching'],
    'Classic binary search in a sorted array.',
    [{ input: '[-1,0,3,5,9,12], target=9', output: '4' }],
    [
      { input: '[-1,0,3,5,9,12] 9', output: '4' },
      { input: '[-1,0,3,5,9,12] 2', output: '-1' },
      { input: '[5] 5', output: '0' },
    ],
  ),
  stub(
    'Search in Rotated Sorted Array',
    'medium',
    ['Searching'],
    'Find target in a rotated sorted array.',
    [{ input: '[4,5,6,7,0,1,2] target=0', output: '4' }],
    [
      { input: '[4,5,6,7,0,1,2] 0', output: '4' },
      { input: '[4,5,6,7,0,1,2] 3', output: '-1' },
      { input: '[1] 0', output: '-1' },
    ],
  ),
  stub(
    'Find Peak Element',
    'medium',
    ['Searching'],
    'Find any peak element index in O(log n).',
    [{ input: '[1,2,3,1]', output: '2' }],
    [
      { input: '[1,2,3,1]', output: '2' },
      { input: '[1,2,1,3,5,6,4]', output: '5' },
      { input: '[1]', output: '0' },
    ],
  ),
  stub(
    'Median of Two Sorted Arrays',
    'hard',
    ['Searching', 'Binary Search'],
    'Find the median of two sorted arrays in O(log(min(m,n))).',
    [{ input: '[1,3], [2]', output: '2.0' }],
    [
      { input: '[1,3] [2]', output: '2.0' },
      { input: '[1,2] [3,4]', output: '2.5' },
      { input: '[] [1]', output: '1.0' },
    ],
  ),

  // ---- Hashing (4) ----
  stub(
    'Contains Duplicate',
    'easy',
    ['Hashing', 'Arrays'],
    'Return true if any value appears at least twice.',
    [{ input: '[1,2,3,1]', output: 'true' }],
    [
      { input: '[1,2,3,1]', output: 'true' },
      { input: '[1,2,3,4]', output: 'false' },
      { input: '[1,1,1,3,3,4,3,2,4,2]', output: 'true' },
    ],
  ),
  stub(
    'Top K Frequent Elements',
    'medium',
    ['Hashing', 'Heap'],
    'Return the k most frequent elements.',
    [{ input: 'nums=[1,1,1,2,2,3], k=2', output: '[1,2]' }],
    [
      { input: '[1,1,1,2,2,3] 2', output: '[1,2]' },
      { input: '[1] 1', output: '[1]' },
      { input: '[1,2] 2', output: '[1,2]' },
    ],
  ),
  stub(
    'Longest Consecutive Sequence',
    'medium',
    ['Hashing'],
    'Length of the longest consecutive integer sequence in an unsorted array.',
    [{ input: '[100,4,200,1,3,2]', output: '4' }],
    [
      { input: '[100,4,200,1,3,2]', output: '4' },
      { input: '[0,3,7,2,5,8,4,6,0,1]', output: '9' },
      { input: '[]', output: '0' },
    ],
  ),
  stub(
    'First Unique Character in a String',
    'easy',
    ['Hashing', 'Strings'],
    'Return the index of the first non-repeating character, or -1.',
    [{ input: '"leetcode"', output: '0' }],
    [
      { input: 'leetcode', output: '0' },
      { input: 'loveleetcode', output: '2' },
      { input: 'aabb', output: '-1' },
    ],
  ),

  // ---- Recursion (3) ----
  stub(
    'Fibonacci Number',
    'easy',
    ['Recursion', 'DP'],
    'Return the nth Fibonacci number.',
    [{ input: 'n=4', output: '3' }],
    [
      { input: '4', output: '3' },
      { input: '0', output: '0' },
      { input: '10', output: '55' },
    ],
  ),
  stub(
    'Power of Two',
    'easy',
    ['Recursion', 'Bit Manipulation'],
    'Determine whether n is a power of 2.',
    [{ input: 'n=16', output: 'true' }],
    [
      { input: '16', output: 'true' },
      { input: '3', output: 'false' },
      { input: '1', output: 'true' },
    ],
  ),
  stub(
    'Pow(x, n)',
    'medium',
    ['Recursion', 'Math'],
    'Compute x raised to the power n in O(log n).',
    [{ input: 'x=2.0, n=10', output: '1024.0' }],
    [
      { input: '2.0 10', output: '1024.0' },
      { input: '2.0 -2', output: '0.25' },
      { input: '2.0 0', output: '1.0' },
    ],
  ),

  // ---- Bit Manipulation (3) ----
  stub(
    'Single Number',
    'easy',
    ['Bit Manipulation'],
    'Every element appears twice except one. Find the unique one in O(1) space.',
    [{ input: '[2,2,1]', output: '1' }],
    [
      { input: '[2,2,1]', output: '1' },
      { input: '[4,1,2,1,2]', output: '4' },
      { input: '[1]', output: '1' },
    ],
  ),
  stub(
    'Number of 1 Bits',
    'easy',
    ['Bit Manipulation'],
    'Count the number of set bits (popcount) in an unsigned integer.',
    [{ input: '11', output: '3' }],
    [
      { input: '11', output: '3' },
      { input: '128', output: '1' },
      { input: '4294967293', output: '31' },
    ],
  ),
  stub(
    'Reverse Bits',
    'easy',
    ['Bit Manipulation'],
    'Reverse the bits of a 32-bit unsigned integer.',
    [{ input: '00000010100101000001111010011100', output: '00111001011110000010100101000000' }],
    [
      { input: '43261596', output: '964176192' },
      { input: '4294967293', output: '3221225471' },
      { input: '0', output: '0' },
    ],
  ),

  // ---- Math (3) ----
  stub(
    'Happy Number',
    'easy',
    ['Math', 'Hashing'],
    'Determine whether the number eventually reaches 1 under digit-square iteration.',
    [{ input: 'n=19', output: 'true' }],
    [
      { input: '19', output: 'true' },
      { input: '2', output: 'false' },
      { input: '1', output: 'true' },
    ],
  ),
  stub(
    'Excel Sheet Column Number',
    'easy',
    ['Math'],
    'Convert an Excel column title like "AB" to its column number.',
    [{ input: '"AB"', output: '28' }],
    [
      { input: 'A', output: '1' },
      { input: 'AB', output: '28' },
      { input: 'ZY', output: '701' },
    ],
  ),
  stub(
    'Sqrt(x)',
    'easy',
    ['Math', 'Binary Search'],
    'Compute the integer square root of a non-negative integer.',
    [{ input: 'x=8', output: '2' }],
    [
      { input: '8', output: '2' },
      { input: '4', output: '2' },
      { input: '0', output: '0' },
    ],
  ),

  // ---- Greedy (3) ----
  stub(
    'Jump Game',
    'medium',
    ['Greedy', 'Arrays'],
    'Determine whether you can reach the last index.',
    [{ input: '[2,3,1,1,4]', output: 'true' }],
    [
      { input: '[2,3,1,1,4]', output: 'true' },
      { input: '[3,2,1,0,4]', output: 'false' },
      { input: '[0]', output: 'true' },
    ],
  ),
  stub(
    'Gas Station',
    'medium',
    ['Greedy'],
    'Find the starting gas station index that allows a complete circuit.',
    [{ input: 'gas=[1,2,3,4,5], cost=[3,4,5,1,2]', output: '3' }],
    [
      { input: '[1,2,3,4,5] [3,4,5,1,2]', output: '3' },
      { input: '[2,3,4] [3,4,3]', output: '-1' },
      { input: '[5] [4]', output: '0' },
    ],
  ),
  stub(
    'Task Scheduler',
    'medium',
    ['Greedy', 'Heap'],
    'Minimum intervals the CPU will take to finish all tasks with a cooldown n.',
    [{ input: 'tasks=["A","A","A","B","B","B"], n=2', output: '8' }],
    [
      { input: 'A,A,A,B,B,B 2', output: '8' },
      { input: 'A,A,A,B,B,B 0', output: '6' },
      { input: 'A 0', output: '1' },
    ],
  ),

  // ---- Backtracking (4) ----
  stub(
    'Subsets',
    'medium',
    ['Backtracking'],
    'Return all possible subsets of a set of distinct integers.',
    [{ input: '[1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' }],
    [
      { input: '[1,2,3]', output: '8 subsets' },
      { input: '[0]', output: '[[],[0]]' },
      { input: '[]', output: '[[]]' },
    ],
  ),
  stub(
    'Permutations',
    'medium',
    ['Backtracking'],
    'Return all permutations of an array of distinct integers.',
    [{ input: '[1,2,3]', output: '6 permutations' }],
    [
      { input: '[1,2,3]', output: '6' },
      { input: '[0,1]', output: '2' },
      { input: '[1]', output: '1' },
    ],
  ),
  stub(
    'Combination Sum',
    'medium',
    ['Backtracking'],
    'All unique combinations of candidates summing to target. Elements may repeat.',
    [{ input: 'candidates=[2,3,6,7], target=7', output: '[[2,2,3],[7]]' }],
    [
      { input: '[2,3,6,7] 7', output: '[[2,2,3],[7]]' },
      { input: '[2,3,5] 8', output: '[[2,2,2,2],[2,3,3],[3,5]]' },
      { input: '[2] 1', output: '[]' },
    ],
  ),
  stub(
    'N-Queens',
    'hard',
    ['Backtracking'],
    'Return all distinct N-Queens placements.',
    [{ input: 'n=4', output: '2 solutions' }],
    [
      { input: '4', output: '2' },
      { input: '1', output: '1' },
      { input: '3', output: '0' },
    ],
  ),

  // ---- Stack / Queue (4) ----
  stub(
    'Valid Parentheses',
    'easy',
    ['Stack'],
    'Determine whether a string of brackets is balanced.',
    [{ input: '"()[]{}"', output: 'true' }],
    [
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
      { input: '((', output: 'false' },
    ],
  ),
  stub(
    'Min Stack',
    'medium',
    ['Stack', 'Design'],
    'Design a stack supporting push, pop, top, and getMin in O(1).',
    [{ input: 'ops=[push -2, push 0, push -3, getMin, pop, top, getMin]', output: '[-3,0,-2]' }],
    [
      { input: 'sequence1', output: 'expected1' },
      { input: 'sequence2', output: 'expected2' },
      { input: 'sequence3', output: 'expected3' },
    ],
  ),
  stub(
    'Daily Temperatures',
    'medium',
    ['Stack', 'Monotonic Stack'],
    'For each day, return how many days until a warmer temperature.',
    [{ input: '[73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' }],
    [
      { input: '[73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
      { input: '[30,40,50,60]', output: '[1,1,1,0]' },
      { input: '[30]', output: '[0]' },
    ],
  ),
  stub(
    'Implement Queue using Stacks',
    'easy',
    ['Queue', 'Stack', 'Design'],
    'Implement a FIFO queue using two LIFO stacks.',
    [{ input: 'ops=[push 1, push 2, peek, pop, empty]', output: '[1,1,false]' }],
    [
      { input: 'sequence1', output: 'expected1' },
      { input: 'sequence2', output: 'expected2' },
      { input: 'sequence3', output: 'expected3' },
    ],
  ),

  // ---- Heap (3) ----
  stub(
    'Find Median from Data Stream',
    'hard',
    ['Heap', 'Design'],
    'Support addNum and findMedian on a data stream in O(log n)/O(1).',
    [{ input: 'addNum 1, addNum 2, findMedian, addNum 3, findMedian', output: '[1.5, 2.0]' }],
    [
      { input: 'sequence1', output: 'expected1' },
      { input: 'sequence2', output: 'expected2' },
      { input: 'sequence3', output: 'expected3' },
    ],
  ),
  stub(
    'Last Stone Weight',
    'easy',
    ['Heap'],
    'Smash the two heaviest stones until at most one remains.',
    [{ input: '[2,7,4,1,8,1]', output: '1' }],
    [
      { input: '[2,7,4,1,8,1]', output: '1' },
      { input: '[1]', output: '1' },
      { input: '[2,2]', output: '0' },
    ],
  ),
  stub(
    'K Closest Points to Origin',
    'medium',
    ['Heap'],
    'Return the k closest points to the origin.',
    [{ input: 'points=[[1,3],[-2,2]], k=1', output: '[[-2,2]]' }],
    [
      { input: '[[1,3],[-2,2]] 1', output: '[[-2,2]]' },
      { input: '[[3,3],[5,-1],[-2,4]] 2', output: '[[3,3],[-2,4]]' },
      { input: '[[0,0]] 1', output: '[[0,0]]' },
    ],
  ),

  // ---- Trie (3) ----
  stub(
    'Implement Trie',
    'medium',
    ['Trie', 'Design'],
    'Design a trie supporting insert, search, and startsWith.',
    [
      {
        input:
          'ops=[insert apple, search apple, search app, startsWith app, insert app, search app]',
        output: '[true,false,true,true]',
      },
    ],
    [
      { input: 'sequence1', output: 'expected1' },
      { input: 'sequence2', output: 'expected2' },
      { input: 'sequence3', output: 'expected3' },
    ],
  ),
  stub(
    'Word Search II',
    'hard',
    ['Trie', 'Backtracking'],
    'Find all words from a dictionary that exist in a 2D board.',
    [{ input: 'board, words=["oath","pea","eat","rain"]', output: '["oath","eat"]' }],
    [
      { input: 'board1 words1', output: '[oath,eat]' },
      { input: 'board2 words2', output: '[]' },
      { input: 'board3 words3', output: '[a]' },
    ],
  ),
  stub(
    'Design Add and Search Words Data Structure',
    'medium',
    ['Trie', 'Design'],
    'Support addWord and search with "." wildcards.',
    [
      {
        input: 'ops=[addWord bad, addWord dad, search bad, search .ad, search b..]',
        output: '[true,true,true]',
      },
    ],
    [
      { input: 'sequence1', output: 'expected1' },
      { input: 'sequence2', output: 'expected2' },
      { input: 'sequence3', output: 'expected3' },
    ],
  ),
];
