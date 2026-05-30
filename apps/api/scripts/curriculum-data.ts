// 100-exercise universal coding curriculum.
// Each exercise is solvable in Python, JavaScript, C, C++, or Java.
// Same stdin/stdout contract across languages — so test cases are identical.
// Starters give the I/O scaffold and a TODO; the student writes the logic.

export type Exercise = {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  section: string;
  topics: string[];
  description: string;
  examples: { input: string; output: string }[];
  tests: { input: string; output: string }[];
  // Starter code per language. Each is a runnable program that reads stdin
  // and prints to stdout but with TODOs for the actual logic.
  starters: {
    python: string;
    javascript: string;
    c: string;
    cpp: string;
    java: string;
  };
};

// ---------- starter templates ----------
// Helpers that build typical I/O scaffolds so the data file stays compact.

const py = (body: string) => `import sys
data = sys.stdin.read().strip()
${body}
`;

const js = (body: string) => `const data = require('fs').readFileSync(0, 'utf8').trim();
${body}
`;

const cMain = (body: string) => `#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
${body}
    return 0;
}
`;

const cppMain = (body: string) => `#include <bits/stdc++.h>
using namespace std;

int main() {
${body}
    return 0;
}
`;

const javaMain = (body: string) => `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
${body}
    }
}
`;

// Common scaffolds keyed by input shape.
// Each returns starters object.
function s_void(stub: string) {
  return {
    python: `# ${stub}\nprint()`,
    javascript: `// ${stub}\nconsole.log("");`,
    c: cMain(`    /* ${stub} */\n    printf("\\n");`),
    cpp: cppMain(`    /* ${stub} */\n    cout << "" << endl;`),
    java: javaMain(`        /* ${stub} */\n        System.out.println();`),
  };
}

function s_oneInt(stub: string) {
  return {
    python: py(`n = int(data)\n# ${stub}\nprint()`),
    javascript: js(`const n = parseInt(data, 10);\n// ${stub}\nconsole.log("");`),
    c: cMain(`    int n;\n    scanf("%d", &n);\n    /* ${stub} */\n    printf("\\n");`),
    cpp: cppMain(`    int n;\n    cin >> n;\n    /* ${stub} */\n    cout << endl;`),
    java: javaMain(
      `        int n = sc.nextInt();\n        /* ${stub} */\n        System.out.println();`,
    ),
  };
}

function s_twoInt(stub: string) {
  return {
    python: py(`a, b = map(int, data.split())\n# ${stub}\nprint()`),
    javascript: js(`const [a, b] = data.split(/\\s+/).map(Number);\n// ${stub}\nconsole.log("");`),
    c: cMain(`    int a, b;\n    scanf("%d %d", &a, &b);\n    /* ${stub} */\n    printf("\\n");`),
    cpp: cppMain(`    int a, b;\n    cin >> a >> b;\n    /* ${stub} */\n    cout << endl;`),
    java: javaMain(
      `        int a = sc.nextInt(), b = sc.nextInt();\n        /* ${stub} */\n        System.out.println();`,
    ),
  };
}

function s_threeInt(stub: string) {
  return {
    python: py(`a, b, c = map(int, data.split())\n# ${stub}\nprint()`),
    javascript: js(
      `const [a, b, c] = data.split(/\\s+/).map(Number);\n// ${stub}\nconsole.log("");`,
    ),
    c: cMain(
      `    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);\n    /* ${stub} */\n    printf("\\n");`,
    ),
    cpp: cppMain(`    int a, b, c;\n    cin >> a >> b >> c;\n    /* ${stub} */\n    cout << endl;`),
    java: javaMain(
      `        int a = sc.nextInt(), b = sc.nextInt(), c = sc.nextInt();\n        /* ${stub} */\n        System.out.println();`,
    ),
  };
}

function s_oneString(stub: string) {
  return {
    python: py(`s = data\n# ${stub}\nprint()`),
    javascript: js(`const s = data;\n// ${stub}\nconsole.log("");`),
    c: cMain(
      `    char s[1024];\n    fgets(s, sizeof(s), stdin);\n    s[strcspn(s, "\\n")] = 0;\n    /* ${stub} */\n    printf("\\n");`,
    ),
    cpp: cppMain(`    string s;\n    getline(cin, s);\n    /* ${stub} */\n    cout << endl;`),
    java: javaMain(
      `        String s = sc.nextLine();\n        /* ${stub} */\n        System.out.println();`,
    ),
  };
}

function s_intArrayFirstLineN(stub: string) {
  return {
    python: py(
      `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\n# ${stub}\nprint()`,
    ),
    javascript: js(
      `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst arr = lines[1].split(/\\s+/).map(Number);\n// ${stub}\nconsole.log("");`,
    ),
    c: cMain(
      `    int n;\n    scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    /* ${stub} */\n    printf("\\n");\n    free(arr);`,
    ),
    cpp: cppMain(
      `    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    /* ${stub} */\n    cout << endl;`,
    ),
    java: javaMain(
      `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        /* ${stub} */\n        System.out.println();`,
    ),
  };
}

function s_intArrayInlineN(stub: string) {
  // n on first line, array on second line — same as above (kept as alias for clarity)
  return s_intArrayFirstLineN(stub);
}

// ---------- exercise data ----------
// Each exercise's `tests` are stdin → expected stdout pairs.
// Inputs reflect what the user's program receives on stdin.

const E = (e: Exercise): Exercise => e;

export const CURRICULUM: Exercise[] = [
  // ===== Basics (15) =====
  E({
    title: 'Hello, World!',
    slug: 'curr-hello-world',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics'],
    description: 'Write a program that prints the exact text `Hello, World!`.',
    examples: [{ input: '(no input)', output: 'Hello, World!' }],
    tests: [
      { input: '', output: 'Hello, World!' },
      { input: '', output: 'Hello, World!' },
      { input: '', output: 'Hello, World!' },
    ],
    starters: s_void('Print exactly: Hello, World!'),
  }),
  E({
    title: 'Echo a line',
    slug: 'curr-echo-line',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'I/O'],
    description: 'Read one line from stdin and print it back unchanged.',
    examples: [{ input: 'foo bar', output: 'foo bar' }],
    tests: [
      { input: 'hello', output: 'hello' },
      { input: 'one two three', output: 'one two three' },
      { input: 'a', output: 'a' },
    ],
    starters: s_oneString('Print s'),
  }),
  E({
    title: 'Add two integers',
    slug: 'curr-add-two-ints',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read two integers separated by a space. Print their sum.',
    examples: [{ input: '3 5', output: '8' }],
    tests: [
      { input: '3 5', output: '8' },
      { input: '-2 7', output: '5' },
      { input: '0 0', output: '0' },
    ],
    starters: s_twoInt('Print a + b'),
  }),
  E({
    title: 'Subtract two integers',
    slug: 'curr-subtract-two-ints',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read two integers a and b. Print a - b.',
    examples: [{ input: '10 4', output: '6' }],
    tests: [
      { input: '10 4', output: '6' },
      { input: '5 10', output: '-5' },
      { input: '0 0', output: '0' },
    ],
    starters: s_twoInt('Print a - b'),
  }),
  E({
    title: 'Multiply two integers',
    slug: 'curr-multiply-two-ints',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read two integers a and b. Print a * b.',
    examples: [{ input: '4 5', output: '20' }],
    tests: [
      { input: '4 5', output: '20' },
      { input: '-3 6', output: '-18' },
      { input: '0 99', output: '0' },
    ],
    starters: s_twoInt('Print a * b'),
  }),
  E({
    title: 'Integer division',
    slug: 'curr-integer-division',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description:
      'Read two integers a and b (b > 0). Print the integer quotient a / b (floor toward zero).',
    examples: [{ input: '17 5', output: '3' }],
    tests: [
      { input: '17 5', output: '3' },
      { input: '20 4', output: '5' },
      { input: '7 2', output: '3' },
    ],
    starters: s_twoInt('Print integer a / b'),
  }),
  E({
    title: 'Modulo',
    slug: 'curr-modulo',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read two positive integers a and b. Print a mod b.',
    examples: [{ input: '17 5', output: '2' }],
    tests: [
      { input: '17 5', output: '2' },
      { input: '100 7', output: '2' },
      { input: '9 3', output: '0' },
    ],
    starters: s_twoInt('Print a % b'),
  }),
  E({
    title: 'Rectangle area',
    slug: 'curr-rectangle-area',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read width and height (integers). Print the area.',
    examples: [{ input: '4 5', output: '20' }],
    tests: [
      { input: '4 5', output: '20' },
      { input: '10 10', output: '100' },
      { input: '1 1', output: '1' },
    ],
    starters: s_twoInt('Print width * height'),
  }),
  E({
    title: 'Square of N',
    slug: 'curr-square-of-n',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics'],
    description: 'Read one integer N. Print N squared.',
    examples: [{ input: '7', output: '49' }],
    tests: [
      { input: '7', output: '49' },
      { input: '10', output: '100' },
      { input: '0', output: '0' },
    ],
    starters: s_oneInt('Print N*N'),
  }),
  E({
    title: 'Absolute value',
    slug: 'curr-absolute-value',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Math'],
    description: 'Read one integer N. Print |N|.',
    examples: [{ input: '-7', output: '7' }],
    tests: [
      { input: '-7', output: '7' },
      { input: '7', output: '7' },
      { input: '0', output: '0' },
    ],
    starters: s_oneInt('Print abs(N)'),
  }),
  E({
    title: 'Max of two',
    slug: 'curr-max-of-two',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Conditionals'],
    description: 'Read two integers. Print the larger one.',
    examples: [{ input: '4 9', output: '9' }],
    tests: [
      { input: '4 9', output: '9' },
      { input: '10 -3', output: '10' },
      { input: '5 5', output: '5' },
    ],
    starters: s_twoInt('Print max(a, b)'),
  }),
  E({
    title: 'Min of three',
    slug: 'curr-min-of-three',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics', 'Conditionals'],
    description: 'Read three integers. Print the smallest.',
    examples: [{ input: '4 9 1', output: '1' }],
    tests: [
      { input: '4 9 1', output: '1' },
      { input: '7 2 5', output: '2' },
      { input: '-1 -5 -3', output: '-5' },
    ],
    starters: s_threeInt('Print min(a, b, c)'),
  }),
  E({
    title: 'Swap and print',
    slug: 'curr-swap-and-print',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics'],
    description: 'Read two integers a and b. Print them swapped on one line, space-separated.',
    examples: [{ input: '3 7', output: '7 3' }],
    tests: [
      { input: '3 7', output: '7 3' },
      { input: '1 2', output: '2 1' },
      { input: '10 -10', output: '-10 10' },
    ],
    starters: s_twoInt('Print b a'),
  }),
  E({
    title: 'Sum of three',
    slug: 'curr-sum-of-three',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics'],
    description: 'Read three integers. Print their sum.',
    examples: [{ input: '1 2 3', output: '6' }],
    tests: [
      { input: '1 2 3', output: '6' },
      { input: '10 20 30', output: '60' },
      { input: '-1 -2 -3', output: '-6' },
    ],
    starters: s_threeInt('Print a + b + c'),
  }),
  E({
    title: 'Average of three',
    slug: 'curr-average-of-three',
    difficulty: 'easy',
    section: 'Basics',
    topics: ['Basics'],
    description: 'Read three integers. Print their integer average (floor).',
    examples: [{ input: '10 20 30', output: '20' }],
    tests: [
      { input: '10 20 30', output: '20' },
      { input: '1 2 3', output: '2' },
      { input: '0 0 0', output: '0' },
    ],
    starters: s_threeInt('Print (a + b + c) / 3'),
  }),

  // ===== Conditionals (10) =====
  E({
    title: 'Even or odd',
    slug: 'curr-even-or-odd',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description: 'Read N. Print "Even" if N is divisible by 2, else "Odd".',
    examples: [{ input: '4', output: 'Even' }],
    tests: [
      { input: '4', output: 'Even' },
      { input: '7', output: 'Odd' },
      { input: '0', output: 'Even' },
    ],
    starters: s_oneInt('Print Even or Odd'),
  }),
  E({
    title: 'Positive negative or zero',
    slug: 'curr-pos-neg-zero',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description: 'Read N. Print "Positive", "Negative", or "Zero".',
    examples: [{ input: '7', output: 'Positive' }],
    tests: [
      { input: '7', output: 'Positive' },
      { input: '-3', output: 'Negative' },
      { input: '0', output: 'Zero' },
    ],
    starters: s_oneInt('Branch on sign'),
  }),
  E({
    title: 'Leap year',
    slug: 'curr-leap-year',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals', 'Math'],
    description:
      'Read year Y. Print "Leap" if Y is a leap year, else "Not leap". (Divisible by 4 AND (not div by 100 OR div by 400).)',
    examples: [{ input: '2024', output: 'Leap' }],
    tests: [
      { input: '2024', output: 'Leap' },
      { input: '1900', output: 'Not leap' },
      { input: '2000', output: 'Leap' },
    ],
    starters: s_oneInt('Use leap-year rules'),
  }),
  E({
    title: 'Grade from marks',
    slug: 'curr-grade-from-marks',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description: 'Read marks (0..100). Print A (>=90), B (>=75), C (>=50), F (<50).',
    examples: [{ input: '82', output: 'B' }],
    tests: [
      { input: '95', output: 'A' },
      { input: '60', output: 'C' },
      { input: '30', output: 'F' },
    ],
    starters: s_oneInt('Map marks to grade'),
  }),
  E({
    title: 'FizzBuzz single',
    slug: 'curr-fizzbuzz-single',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description:
      'Read N. Print "FizzBuzz" if divisible by 15, "Fizz" by 3 only, "Buzz" by 5 only, else N.',
    examples: [{ input: '15', output: 'FizzBuzz' }],
    tests: [
      { input: '15', output: 'FizzBuzz' },
      { input: '9', output: 'Fizz' },
      { input: '7', output: '7' },
    ],
    starters: s_oneInt('Branch on divisibility'),
  }),
  E({
    title: 'Triangle type',
    slug: 'curr-triangle-type',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description: 'Read three side lengths. Print "Equilateral", "Isosceles", or "Scalene".',
    examples: [{ input: '3 3 3', output: 'Equilateral' }],
    tests: [
      { input: '3 3 3', output: 'Equilateral' },
      { input: '3 3 5', output: 'Isosceles' },
      { input: '3 4 5', output: 'Scalene' },
    ],
    starters: s_threeInt('Compare sides'),
  }),
  E({
    title: 'Valid triangle',
    slug: 'curr-valid-triangle',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description:
      'Read three positive sides. Print "Yes" if they can form a triangle (sum of any two > third), else "No".',
    examples: [{ input: '3 4 5', output: 'Yes' }],
    tests: [
      { input: '3 4 5', output: 'Yes' },
      { input: '1 1 3', output: 'No' },
      { input: '6 8 10', output: 'Yes' },
    ],
    starters: s_threeInt('Triangle inequality'),
  }),
  E({
    title: 'Vowel or consonant',
    slug: 'curr-vowel-or-consonant',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals', 'Strings'],
    description: 'Read a single lowercase letter. Print "Vowel" or "Consonant".',
    examples: [{ input: 'a', output: 'Vowel' }],
    tests: [
      { input: 'a', output: 'Vowel' },
      { input: 'b', output: 'Consonant' },
      { input: 'u', output: 'Vowel' },
    ],
    starters: s_oneString('Check if in aeiou'),
  }),
  E({
    title: 'Largest of three',
    slug: 'curr-largest-of-three',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description: 'Read three integers. Print the largest.',
    examples: [{ input: '4 9 1', output: '9' }],
    tests: [
      { input: '4 9 1', output: '9' },
      { input: '7 2 5', output: '7' },
      { input: '-1 -5 -3', output: '-1' },
    ],
    starters: s_threeInt('Print max(a, b, c)'),
  }),
  E({
    title: 'Quadrant of point',
    slug: 'curr-quadrant-of-point',
    difficulty: 'easy',
    section: 'Conditionals',
    topics: ['Conditionals'],
    description:
      'Read x and y. Print 1, 2, 3, or 4 for the quadrant. Print "Origin" if both 0; "Axis" if exactly one is 0.',
    examples: [{ input: '3 4', output: '1' }],
    tests: [
      { input: '3 4', output: '1' },
      { input: '-3 4', output: '2' },
      { input: '0 0', output: 'Origin' },
    ],
    starters: s_twoInt('Branch on sign of x, y'),
  }),

  // ===== Loops (15) =====
  E({
    title: 'Print 1..N',
    slug: 'curr-print-1-to-n',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops'],
    description: 'Read N. Print integers 1..N space-separated on one line.',
    examples: [{ input: '5', output: '1 2 3 4 5' }],
    tests: [
      { input: '5', output: '1 2 3 4 5' },
      { input: '1', output: '1' },
      { input: '3', output: '1 2 3' },
    ],
    starters: s_oneInt('Loop from 1 to N'),
  }),
  E({
    title: 'Print N..1',
    slug: 'curr-print-n-to-1',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops'],
    description: 'Read N. Print integers N..1 space-separated.',
    examples: [{ input: '5', output: '5 4 3 2 1' }],
    tests: [
      { input: '5', output: '5 4 3 2 1' },
      { input: '1', output: '1' },
      { input: '3', output: '3 2 1' },
    ],
    starters: s_oneInt('Loop from N to 1'),
  }),
  E({
    title: 'Sum 1..N',
    slug: 'curr-sum-1-to-n',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read N. Print 1+2+...+N.',
    examples: [{ input: '10', output: '55' }],
    tests: [
      { input: '10', output: '55' },
      { input: '1', output: '1' },
      { input: '100', output: '5050' },
    ],
    starters: s_oneInt('Accumulate sum'),
  }),
  E({
    title: 'Product 1..N (factorial)',
    slug: 'curr-factorial-iter',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read N (<= 12). Print N! (factorial).',
    examples: [{ input: '5', output: '120' }],
    tests: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '10', output: '3628800' },
    ],
    starters: s_oneInt('Multiply 1..N'),
  }),
  E({
    title: 'Even numbers up to N',
    slug: 'curr-even-up-to-n',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops'],
    description: 'Read N. Print even numbers from 2 to N inclusive, space-separated.',
    examples: [{ input: '10', output: '2 4 6 8 10' }],
    tests: [
      { input: '10', output: '2 4 6 8 10' },
      { input: '1', output: '' },
      { input: '7', output: '2 4 6' },
    ],
    starters: s_oneInt('Iterate even values'),
  }),
  E({
    title: 'Multiplication table of N',
    slug: 'curr-mult-table',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops'],
    description: 'Read N. Print "N x i = N*i" for i = 1..10, one per line.',
    examples: [
      {
        input: '3',
        output:
          '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30',
      },
    ],
    tests: [
      {
        input: '3',
        output:
          '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30',
      },
      {
        input: '2',
        output:
          '2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20',
      },
      {
        input: '1',
        output:
          '1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5\n1 x 6 = 6\n1 x 7 = 7\n1 x 8 = 8\n1 x 9 = 9\n1 x 10 = 10',
      },
    ],
    starters: s_oneInt('Print 10 lines'),
  }),
  E({
    title: 'Sum of digits',
    slug: 'curr-sum-of-digits',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read non-negative N. Print the sum of its decimal digits.',
    examples: [{ input: '1234', output: '10' }],
    tests: [
      { input: '1234', output: '10' },
      { input: '99', output: '18' },
      { input: '0', output: '0' },
    ],
    starters: s_oneInt('Use N % 10 and N / 10'),
  }),
  E({
    title: 'Count digits',
    slug: 'curr-count-digits',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read non-negative N. Print the count of its decimal digits.',
    examples: [{ input: '12345', output: '5' }],
    tests: [
      { input: '12345', output: '5' },
      { input: '7', output: '1' },
      { input: '0', output: '1' },
    ],
    starters: s_oneInt('Divide N by 10 until 0'),
  }),
  E({
    title: 'Reverse a number',
    slug: 'curr-reverse-number',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read N. Print its digits reversed (as an integer, dropping leading zeros).',
    examples: [{ input: '1234', output: '4321' }],
    tests: [
      { input: '1234', output: '4321' },
      { input: '120', output: '21' },
      { input: '7', output: '7' },
    ],
    starters: s_oneInt('Build reversed integer'),
  }),
  E({
    title: 'Number is palindrome',
    slug: 'curr-number-palindrome',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops'],
    description: 'Read N. Print "Yes" if N equals its reverse, else "No".',
    examples: [{ input: '121', output: 'Yes' }],
    tests: [
      { input: '121', output: 'Yes' },
      { input: '123', output: 'No' },
      { input: '7', output: 'Yes' },
    ],
    starters: s_oneInt('Compare N with reverse'),
  }),
  E({
    title: 'Power of N (a^b)',
    slug: 'curr-power-iter',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Loops', 'Math'],
    description: 'Read a and b (b >= 0). Print a^b using a loop.',
    examples: [{ input: '2 10', output: '1024' }],
    tests: [
      { input: '2 10', output: '1024' },
      { input: '3 0', output: '1' },
      { input: '5 3', output: '125' },
    ],
    starters: s_twoInt('Multiply a, b times'),
  }),
  E({
    title: 'GCD (Euclidean)',
    slug: 'curr-gcd',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Math'],
    description:
      'Read two positive integers a and b. Print gcd(a, b) using the Euclidean algorithm.',
    examples: [{ input: '48 18', output: '6' }],
    tests: [
      { input: '48 18', output: '6' },
      { input: '17 5', output: '1' },
      { input: '100 10', output: '10' },
    ],
    starters: s_twoInt('while b: a, b = b, a % b'),
  }),
  E({
    title: 'LCM',
    slug: 'curr-lcm',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Math'],
    description: 'Read two positive integers a and b. Print lcm(a, b) = a*b/gcd(a, b).',
    examples: [{ input: '4 6', output: '12' }],
    tests: [
      { input: '4 6', output: '12' },
      { input: '5 7', output: '35' },
      { input: '10 10', output: '10' },
    ],
    starters: s_twoInt('a*b/gcd'),
  }),
  E({
    title: 'Is prime',
    slug: 'curr-is-prime',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Math'],
    description: 'Read N (>= 2). Print "Yes" if N is prime, else "No".',
    examples: [{ input: '7', output: 'Yes' }],
    tests: [
      { input: '7', output: 'Yes' },
      { input: '4', output: 'No' },
      { input: '13', output: 'Yes' },
    ],
    starters: s_oneInt('Check divisibility up to sqrt(N)'),
  }),
  E({
    title: 'Print primes up to N',
    slug: 'curr-primes-up-to-n',
    difficulty: 'easy',
    section: 'Loops',
    topics: ['Math', 'Loops'],
    description: 'Read N. Print primes from 2 to N, space-separated on one line.',
    examples: [{ input: '20', output: '2 3 5 7 11 13 17 19' }],
    tests: [
      { input: '20', output: '2 3 5 7 11 13 17 19' },
      { input: '10', output: '2 3 5 7' },
      { input: '2', output: '2' },
    ],
    starters: s_oneInt('Filter primes'),
  }),

  // ===== Strings (15) =====
  E({
    title: 'String length',
    slug: 'curr-string-length',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Print its length.',
    examples: [{ input: 'hello', output: '5' }],
    tests: [
      { input: 'hello', output: '5' },
      { input: 'a', output: '1' },
      { input: 'foo bar', output: '7' },
    ],
    starters: s_oneString('Print len(s)'),
  }),
  E({
    title: 'Reverse a string',
    slug: 'curr-reverse-string',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Print it reversed.',
    examples: [{ input: 'hello', output: 'olleh' }],
    tests: [
      { input: 'hello', output: 'olleh' },
      { input: 'a', output: 'a' },
      { input: 'racecar', output: 'racecar' },
    ],
    starters: s_oneString('Reverse and print'),
  }),
  E({
    title: 'String to uppercase',
    slug: 'curr-string-upper',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Print it in uppercase.',
    examples: [{ input: 'hello world', output: 'HELLO WORLD' }],
    tests: [
      { input: 'hello world', output: 'HELLO WORLD' },
      { input: 'Foo', output: 'FOO' },
      { input: 'a', output: 'A' },
    ],
    starters: s_oneString('Uppercase'),
  }),
  E({
    title: 'String to lowercase',
    slug: 'curr-string-lower',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Print it in lowercase.',
    examples: [{ input: 'HELLO World', output: 'hello world' }],
    tests: [
      { input: 'HELLO World', output: 'hello world' },
      { input: 'FOO', output: 'foo' },
      { input: 'a', output: 'a' },
    ],
    starters: s_oneString('Lowercase'),
  }),
  E({
    title: 'Count vowels',
    slug: 'curr-count-vowels',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings', 'Loops'],
    description: 'Read one line. Print the number of vowels (a, e, i, o, u — case-insensitive).',
    examples: [{ input: 'hello world', output: '3' }],
    tests: [
      { input: 'hello world', output: '3' },
      { input: 'AEIOU', output: '5' },
      { input: 'bcdfg', output: '0' },
    ],
    starters: s_oneString('Iterate and count'),
  }),
  E({
    title: 'Count words',
    slug: 'curr-count-words',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Print the count of whitespace-separated words.',
    examples: [{ input: 'hello world foo', output: '3' }],
    tests: [
      { input: 'hello world foo', output: '3' },
      { input: 'a', output: '1' },
      { input: 'one  two   three', output: '3' },
    ],
    starters: s_oneString('Split on whitespace'),
  }),
  E({
    title: 'Is palindrome',
    slug: 'curr-string-palindrome',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Read one line. Print "Yes" if it reads the same forwards and backwards (case-sensitive), else "No".',
    examples: [{ input: 'racecar', output: 'Yes' }],
    tests: [
      { input: 'racecar', output: 'Yes' },
      { input: 'hello', output: 'No' },
      { input: 'a', output: 'Yes' },
    ],
    starters: s_oneString('Compare with reverse'),
  }),
  E({
    title: 'Replace spaces with dashes',
    slug: 'curr-replace-spaces',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one line. Replace every space with "-" and print.',
    examples: [{ input: 'hello world foo', output: 'hello-world-foo' }],
    tests: [
      { input: 'hello world foo', output: 'hello-world-foo' },
      { input: 'no_spaces', output: 'no_spaces' },
      { input: 'a b', output: 'a-b' },
    ],
    starters: s_oneString('Replace " " with "-"'),
  }),
  E({
    title: 'First character',
    slug: 'curr-first-character',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one non-empty line. Print its first character.',
    examples: [{ input: 'hello', output: 'h' }],
    tests: [
      { input: 'hello', output: 'h' },
      { input: 'a', output: 'a' },
      { input: 'Zebra', output: 'Z' },
    ],
    starters: s_oneString('Print s[0]'),
  }),
  E({
    title: 'Last character',
    slug: 'curr-last-character',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Read one non-empty line. Print its last character.',
    examples: [{ input: 'hello', output: 'o' }],
    tests: [
      { input: 'hello', output: 'o' },
      { input: 'a', output: 'a' },
      { input: 'world!', output: '!' },
    ],
    starters: s_oneString('Print last char'),
  }),
  E({
    title: 'Count specific char',
    slug: 'curr-count-char',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Input has two lines: a string s, then a single character c. Print how many times c appears in s.',
    examples: [{ input: 'banana\na', output: '3' }],
    tests: [
      { input: 'banana\na', output: '3' },
      { input: 'hello world\nl', output: '3' },
      { input: 'abc\nz', output: '0' },
    ],
    starters: {
      python: py(`s, c = data.split("\\n")\n# count c in s\nprint()`),
      javascript: js(`const [s, c] = data.split(/\\n/);\n// count\nconsole.log("");`),
      c: cMain(
        `    char s[1024], c;\n    fgets(s, sizeof(s), stdin);\n    scanf(" %c", &c);\n    /* count c in s */\n    printf("\\n");`,
      ),
      cpp: cppMain(
        `    string s; char c;\n    getline(cin, s);\n    cin >> c;\n    /* count */\n    cout << endl;`,
      ),
      java: javaMain(
        `        String s = sc.nextLine();\n        char c = sc.next().charAt(0);\n        /* count */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Anagram check',
    slug: 'curr-anagram-check',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings', 'Hashing'],
    description:
      'Two lines: strings a and b. Print "Yes" if they are anagrams, else "No". Case-sensitive.',
    examples: [{ input: 'listen\nsilent', output: 'Yes' }],
    tests: [
      { input: 'listen\nsilent', output: 'Yes' },
      { input: 'hello\nworld', output: 'No' },
      { input: 'abc\ncba', output: 'Yes' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\n# sorted compare\nprint()`),
      javascript: js(`const [a, b] = data.split(/\\n/);\n// sort and compare\nconsole.log("");`),
      c: cMain(
        `    char a[256], b[256];\n    fgets(a, sizeof(a), stdin); a[strcspn(a,"\\n")] = 0;\n    fgets(b, sizeof(b), stdin); b[strcspn(b,"\\n")] = 0;\n    /* count letters and compare */\n    printf("\\n");`,
      ),
      cpp: cppMain(
        `    string a, b;\n    getline(cin, a); getline(cin, b);\n    /* sort or count */\n    cout << endl;`,
      ),
      java: javaMain(
        `        String a = sc.nextLine(), b = sc.nextLine();\n        /* sort chars and compare */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Concatenate',
    slug: 'curr-concatenate',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description: 'Two lines: strings a and b. Print a + b.',
    examples: [{ input: 'foo\nbar', output: 'foobar' }],
    tests: [
      { input: 'foo\nbar', output: 'foobar' },
      { input: 'hello \nworld', output: 'hello world' },
      { input: '\nabc', output: 'abc' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\nprint(a + b)`),
      javascript: js(`const [a, b] = data.split(/\\n/);\nconsole.log(a + b);`),
      c: cMain(
        `    char a[256], b[256];\n    fgets(a, sizeof(a), stdin); a[strcspn(a,"\\n")] = 0;\n    fgets(b, sizeof(b), stdin); b[strcspn(b,"\\n")] = 0;\n    printf("%s%s\\n", a, b);`,
      ),
      cpp: cppMain(
        `    string a, b;\n    getline(cin, a); getline(cin, b);\n    cout << a + b << endl;`,
      ),
      java: javaMain(
        `        String a = sc.nextLine(), b = sc.nextLine();\n        System.out.println(a + b);`,
      ),
    },
  }),
  E({
    title: 'String contains substring',
    slug: 'curr-string-contains',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings'],
    description:
      'Two lines: haystack and needle. Print "Yes" if haystack contains needle, else "No".',
    examples: [{ input: 'hello world\nworld', output: 'Yes' }],
    tests: [
      { input: 'hello world\nworld', output: 'Yes' },
      { input: 'banana\napp', output: 'No' },
      { input: 'foobar\nfoo', output: 'Yes' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\nprint("")`),
      javascript: js(`const [a, b] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(
        `    char a[1024], b[256];\n    fgets(a, sizeof(a), stdin); a[strcspn(a,"\\n")] = 0;\n    fgets(b, sizeof(b), stdin); b[strcspn(b,"\\n")] = 0;\n    printf("\\n");`,
      ),
      cpp: cppMain(`    string a, b;\n    getline(cin, a); getline(cin, b);\n    cout << endl;`),
      java: javaMain(
        `        String a = sc.nextLine(), b = sc.nextLine();\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'First non-repeating char',
    slug: 'curr-first-unique-char',
    difficulty: 'medium',
    section: 'Strings',
    topics: ['Strings', 'Hashing'],
    description: 'Read one line. Print the first character that appears only once, or "-" if none.',
    examples: [{ input: 'leetcode', output: 'l' }],
    tests: [
      { input: 'leetcode', output: 'l' },
      { input: 'aabb', output: '-' },
      { input: 'loveleetcode', output: 'v' },
    ],
    starters: s_oneString('Count freqs, then pick first with count==1'),
  }),

  // ===== Arrays (15) =====
  E({
    title: 'Sum of array',
    slug: 'curr-sum-of-array',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N integers. Print their sum.',
    examples: [{ input: '5\n1 2 3 4 5', output: '15' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '15' },
      { input: '3\n-1 -2 -3', output: '-6' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Accumulate sum'),
  }),
  E({
    title: 'Max of array',
    slug: 'curr-max-of-array',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N integers. Print the maximum.',
    examples: [{ input: '5\n3 1 4 1 5', output: '5' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '5' },
      { input: '3\n-1 -7 -3', output: '-1' },
      { input: '1\n42', output: '42' },
    ],
    starters: s_intArrayInlineN('Track max'),
  }),
  E({
    title: 'Min of array',
    slug: 'curr-min-of-array',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N integers. Print the minimum.',
    examples: [{ input: '5\n3 1 4 1 5', output: '1' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '1' },
      { input: '3\n-1 -7 -3', output: '-7' },
      { input: '1\n42', output: '42' },
    ],
    starters: s_intArrayInlineN('Track min'),
  }),
  E({
    title: 'Average of array',
    slug: 'curr-average-of-array',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N integers. Print integer average (floor).',
    examples: [{ input: '5\n1 2 3 4 5', output: '3' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '3' },
      { input: '3\n10 20 30', output: '20' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Sum / N'),
  }),
  E({
    title: 'Reverse array',
    slug: 'curr-reverse-array',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N integers. Print the array reversed, space-separated.',
    examples: [{ input: '5\n1 2 3 4 5', output: '5 4 3 2 1' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '3\n1 2 3', output: '3 2 1' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Print in reverse'),
  }),
  E({
    title: 'Count occurrences',
    slug: 'curr-count-occurrences',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description:
      'First line N, second line N integers, third line target T. Print how many times T appears.',
    examples: [{ input: '5\n1 2 3 2 1\n2', output: '2' }],
    tests: [
      { input: '5\n1 2 3 2 1\n2', output: '2' },
      { input: '3\n7 7 7\n7', output: '3' },
      { input: '3\n1 2 3\n9', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nt = int(lines[2])\n# count t in arr\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst t = parseInt(lines[2], 10);\n// count\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, t;\n    scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &t);\n    /* count */\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, t; cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    cin >> t;\n    /* count */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int t = sc.nextInt();\n        /* count */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Linear search index',
    slug: 'curr-linear-search',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays', 'Searching'],
    description:
      'N then N integers then target T. Print the 0-indexed position of the first occurrence of T, or -1.',
    examples: [{ input: '5\n4 5 6 7 8\n6', output: '2' }],
    tests: [
      { input: '5\n4 5 6 7 8\n6', output: '2' },
      { input: '3\n1 2 3\n5', output: '-1' },
      { input: '1\n7\n7', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nt = int(lines[2])\n# find index\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst t = parseInt(lines[2], 10);\n// indexOf\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, t;\n    scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &t);\n    /* find index */\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, t; cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    cin >> t;\n    /* find */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int t = sc.nextInt();\n        /* find */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Second largest',
    slug: 'curr-second-largest',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'First line N, second line N distinct integers. Print the second largest.',
    examples: [{ input: '5\n3 1 4 1 5', output: '4' }],
    tests: [
      { input: '5\n3 1 4 7 5', output: '5' },
      { input: '3\n10 20 30', output: '20' },
      { input: '2\n1 2', output: '1' },
    ],
    starters: s_intArrayInlineN('Track top two'),
  }),
  E({
    title: 'Even elements',
    slug: 'curr-even-elements',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'N then N integers. Print the even-valued elements in order, space-separated.',
    examples: [{ input: '5\n1 2 3 4 5', output: '2 4' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '2 4' },
      { input: '4\n2 4 6 8', output: '2 4 6 8' },
      { input: '3\n1 3 5', output: '' },
    ],
    starters: s_intArrayInlineN('Filter even'),
  }),
  E({
    title: 'Bubble sort',
    slug: 'curr-bubble-sort',
    difficulty: 'medium',
    section: 'Arrays',
    topics: ['Arrays', 'Sorting'],
    description: 'N then N integers. Print sorted ascending, space-separated.',
    examples: [{ input: '5\n3 1 4 1 5', output: '1 1 3 4 5' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '1 1 3 4 5' },
      { input: '3\n5 4 3', output: '3 4 5' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Implement bubble sort'),
  }),
  E({
    title: 'Sort descending',
    slug: 'curr-sort-desc',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays', 'Sorting'],
    description: 'N then N integers. Print sorted descending, space-separated.',
    examples: [{ input: '5\n3 1 4 1 5', output: '5 4 3 1 1' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '5 4 3 1 1' },
      { input: '3\n1 2 3', output: '3 2 1' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Sort descending'),
  }),
  E({
    title: 'Sum of even positions',
    slug: 'curr-sum-even-positions',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description:
      'N then N integers. Print sum of elements at even 0-indexed positions (0, 2, 4, ...).',
    examples: [{ input: '5\n1 2 3 4 5', output: '9' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '9' },
      { input: '4\n10 20 30 40', output: '40' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Sum arr[0], arr[2], ...'),
  }),
  E({
    title: 'Remove duplicates (preserve order)',
    slug: 'curr-remove-duplicates',
    difficulty: 'medium',
    section: 'Arrays',
    topics: ['Arrays', 'Hashing'],
    description:
      'N then N integers. Print distinct elements in first-occurrence order, space-separated.',
    examples: [{ input: '6\n1 2 2 3 1 4', output: '1 2 3 4' }],
    tests: [
      { input: '6\n1 2 2 3 1 4', output: '1 2 3 4' },
      { input: '3\n5 5 5', output: '5' },
      { input: '4\n1 2 3 4', output: '1 2 3 4' },
    ],
    starters: s_intArrayInlineN('Use a set to track seen'),
  }),
  E({
    title: 'Rotate left by 1',
    slug: 'curr-rotate-left-1',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description: 'N then N integers. Print the array rotated left by one position.',
    examples: [{ input: '5\n1 2 3 4 5', output: '2 3 4 5 1' }],
    tests: [
      { input: '5\n1 2 3 4 5', output: '2 3 4 5 1' },
      { input: '3\n10 20 30', output: '20 30 10' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Move first element to the end'),
  }),
  E({
    title: 'Sum of two arrays element-wise',
    slug: 'curr-array-elementwise-sum',
    difficulty: 'easy',
    section: 'Arrays',
    topics: ['Arrays'],
    description:
      'Line 1: N. Line 2: N integers (a). Line 3: N integers (b). Print a[i]+b[i] for all i, space-separated.',
    examples: [{ input: '3\n1 2 3\n4 5 6', output: '5 7 9' }],
    tests: [
      { input: '3\n1 2 3\n4 5 6', output: '5 7 9' },
      { input: '2\n10 20\n1 1', output: '11 21' },
      { input: '1\n5\n7', output: '12' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\na = list(map(int, lines[1].split()))\nb = list(map(int, lines[2].split()))\n# sum element-wise\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst a = lines[1].split(/\\s+/).map(Number);\nconst b = lines[2].split(/\\s+/).map(Number);\n// sum\nconsole.log("");`,
      ),
      c: cMain(
        `    int n;\n    scanf("%d", &n);\n    int *a = malloc(n * sizeof(int)), *b = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &a[i]);\n    for (int i = 0; i < n; i++) scanf("%d", &b[i]);\n    /* print a[i]+b[i] */\n    printf("\\n");\n    free(a); free(b);`,
      ),
      cpp: cppMain(
        `    int n; cin >> n;\n    vector<int> a(n), b(n);\n    for (auto& x : a) cin >> x;\n    for (auto& x : b) cin >> x;\n    /* sum */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] a = new int[n], b = new int[n];\n        for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n        for (int i = 0; i < n; i++) b[i] = sc.nextInt();\n        /* sum */\n        System.out.println();`,
      ),
    },
  }),

  // ===== Recursion / Functions (10) =====
  E({
    title: 'Recursive factorial',
    slug: 'curr-factorial-rec',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion', 'Math'],
    description: 'Read N (<= 12). Compute N! using a recursive function. Print it.',
    examples: [{ input: '5', output: '120' }],
    tests: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '12', output: '479001600' },
    ],
    starters: s_oneInt('Recursive call'),
  }),
  E({
    title: 'Recursive fibonacci',
    slug: 'curr-fib-rec',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description:
      'Read N (<= 30). Print the Nth Fibonacci number (0-indexed, F(0)=0, F(1)=1) using recursion.',
    examples: [{ input: '10', output: '55' }],
    tests: [
      { input: '10', output: '55' },
      { input: '0', output: '0' },
      { input: '15', output: '610' },
    ],
    starters: s_oneInt('Recursive fib'),
  }),
  E({
    title: 'Recursive sum 1..N',
    slug: 'curr-rec-sum',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description: 'Read N. Use recursion to compute 1+2+...+N. Print it.',
    examples: [{ input: '100', output: '5050' }],
    tests: [
      { input: '100', output: '5050' },
      { input: '1', output: '1' },
      { input: '10', output: '55' },
    ],
    starters: s_oneInt('Recursive'),
  }),
  E({
    title: 'Recursive power',
    slug: 'curr-rec-power',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion', 'Math'],
    description: 'Read a and b (b >= 0). Compute a^b using recursion. Print it.',
    examples: [{ input: '2 10', output: '1024' }],
    tests: [
      { input: '2 10', output: '1024' },
      { input: '3 0', output: '1' },
      { input: '5 3', output: '125' },
    ],
    starters: s_twoInt('Recursive power'),
  }),
  E({
    title: 'Sum of digits (recursive)',
    slug: 'curr-rec-sum-digits',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description: 'Read non-negative N. Print sum of digits using recursion.',
    examples: [{ input: '1234', output: '10' }],
    tests: [
      { input: '1234', output: '10' },
      { input: '99', output: '18' },
      { input: '0', output: '0' },
    ],
    starters: s_oneInt('N % 10 + recur(N / 10)'),
  }),
  E({
    title: 'Tower of Hanoi moves',
    slug: 'curr-hanoi-moves',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description:
      'Read N (<= 20). Print the minimum number of moves to solve Tower of Hanoi: 2^N - 1.',
    examples: [{ input: '3', output: '7' }],
    tests: [
      { input: '3', output: '7' },
      { input: '1', output: '1' },
      { input: '10', output: '1023' },
    ],
    starters: s_oneInt('2^N - 1'),
  }),
  E({
    title: 'String reverse recursive',
    slug: 'curr-rec-string-reverse',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion', 'Strings'],
    description: 'Read a line. Use recursion to print it reversed.',
    examples: [{ input: 'hello', output: 'olleh' }],
    tests: [
      { input: 'hello', output: 'olleh' },
      { input: 'a', output: 'a' },
      { input: 'recursion', output: 'noisrucer' },
    ],
    starters: s_oneString('Recursive reverse'),
  }),
  E({
    title: 'Count down recursive',
    slug: 'curr-rec-countdown',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description: 'Read N. Use recursion to print N, N-1, ..., 1 space-separated.',
    examples: [{ input: '5', output: '5 4 3 2 1' }],
    tests: [
      { input: '5', output: '5 4 3 2 1' },
      { input: '1', output: '1' },
      { input: '3', output: '3 2 1' },
    ],
    starters: s_oneInt('Print then recur'),
  }),
  E({
    title: 'Power of two (recursive check)',
    slug: 'curr-rec-power-of-two',
    difficulty: 'easy',
    section: 'Recursion',
    topics: ['Recursion'],
    description: 'Read N (>=1). Print "Yes" if N is a power of two, else "No". Use recursion.',
    examples: [{ input: '16', output: 'Yes' }],
    tests: [
      { input: '16', output: 'Yes' },
      { input: '6', output: 'No' },
      { input: '1', output: 'Yes' },
    ],
    starters: s_oneInt('Divide by 2 recursively'),
  }),
  E({
    title: 'Binary search (recursive)',
    slug: 'curr-rec-binary-search',
    difficulty: 'medium',
    section: 'Recursion',
    topics: ['Recursion', 'Searching'],
    description:
      'N then N sorted integers then target T. Print 0-indexed position via recursive binary search, or -1.',
    examples: [{ input: '5\n1 3 5 7 9\n7', output: '3' }],
    tests: [
      { input: '5\n1 3 5 7 9\n7', output: '3' },
      { input: '5\n1 3 5 7 9\n4', output: '-1' },
      { input: '1\n42\n42', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nt = int(lines[2])\n# binary search\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst t = parseInt(lines[2], 10);\n// binary search\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, t;\n    scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &t);\n    /* recursive binary search */\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, t; cin >> n;\n    vector<int> arr(n);\n    for (auto& x : arr) cin >> x;\n    cin >> t;\n    /* recursive binary search */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int t = sc.nextInt();\n        /* recursive binary search */\n        System.out.println();`,
      ),
    },
  }),

  // ===== Math (10) =====
  E({
    title: 'Decimal to binary',
    slug: 'curr-dec-to-bin',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description:
      'Read non-negative N. Print its binary representation (no leading zeros, "0" if N=0).',
    examples: [{ input: '10', output: '1010' }],
    tests: [
      { input: '10', output: '1010' },
      { input: '0', output: '0' },
      { input: '255', output: '11111111' },
    ],
    starters: s_oneInt('Repeated /2'),
  }),
  E({
    title: 'Binary to decimal',
    slug: 'curr-bin-to-dec',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read a binary string. Print its decimal value.',
    examples: [{ input: '1010', output: '10' }],
    tests: [
      { input: '1010', output: '10' },
      { input: '0', output: '0' },
      { input: '11111111', output: '255' },
    ],
    starters: s_oneString('Convert to int base 2'),
  }),
  E({
    title: 'Integer square root',
    slug: 'curr-isqrt',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read non-negative N. Print floor(sqrt(N)).',
    examples: [{ input: '17', output: '4' }],
    tests: [
      { input: '17', output: '4' },
      { input: '0', output: '0' },
      { input: '100', output: '10' },
    ],
    starters: s_oneInt('Use loop or sqrt'),
  }),
  E({
    title: 'Modular exponentiation',
    slug: 'curr-mod-exp',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read base, exp, mod. Print (base^exp) mod m. (use fast exponentiation)',
    examples: [{ input: '2 10 1000', output: '24' }],
    tests: [
      { input: '2 10 1000', output: '24' },
      { input: '3 7 5', output: '2' },
      { input: '5 0 13', output: '1' },
    ],
    starters: s_threeInt('Fast power with mod'),
  }),
  E({
    title: 'Count prime factors',
    slug: 'curr-count-prime-factors',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (>=2). Print the count of distinct prime factors.',
    examples: [{ input: '12', output: '2' }],
    tests: [
      { input: '12', output: '2' },
      { input: '30', output: '3' },
      { input: '7', output: '1' },
    ],
    starters: s_oneInt('Trial division'),
  }),
  E({
    title: 'Armstrong number',
    slug: 'curr-armstrong',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description:
      'Read N. Print "Yes" if N equals the sum of its digits each raised to the count of digits, else "No".',
    examples: [{ input: '153', output: 'Yes' }],
    tests: [
      { input: '153', output: 'Yes' },
      { input: '370', output: 'Yes' },
      { input: '100', output: 'No' },
    ],
    starters: s_oneInt('Sum of d^k'),
  }),
  E({
    title: 'Perfect number',
    slug: 'curr-perfect-number',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (>=1). Print "Yes" if the sum of proper divisors equals N, else "No".',
    examples: [{ input: '6', output: 'Yes' }],
    tests: [
      { input: '6', output: 'Yes' },
      { input: '28', output: 'Yes' },
      { input: '10', output: 'No' },
    ],
    starters: s_oneInt('Sum proper divisors'),
  }),
  E({
    title: 'Count divisors',
    slug: 'curr-count-divisors',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N (>=1). Print the count of divisors of N.',
    examples: [{ input: '12', output: '6' }],
    tests: [
      { input: '12', output: '6' },
      { input: '7', output: '2' },
      { input: '1', output: '1' },
    ],
    starters: s_oneInt('Loop to sqrt(N)'),
  }),
  E({
    title: 'nCr (small)',
    slug: 'curr-ncr',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Math'],
    description: 'Read n and r (0 <= r <= n <= 20). Print binomial coefficient C(n, r).',
    examples: [{ input: '5 2', output: '10' }],
    tests: [
      { input: '5 2', output: '10' },
      { input: '10 3', output: '120' },
      { input: '0 0', output: '1' },
    ],
    starters: s_twoInt('n! / (r! (n-r)!)'),
  }),
  E({
    title: 'Sum of first N squares',
    slug: 'curr-sum-squares',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: 'Read N. Print 1^2 + 2^2 + ... + N^2.',
    examples: [{ input: '5', output: '55' }],
    tests: [
      { input: '5', output: '55' },
      { input: '1', output: '1' },
      { input: '10', output: '385' },
    ],
    starters: s_oneInt('Closed form or loop'),
  }),

  // ===== Intermediate (10) =====
  E({
    title: 'Matrix transpose',
    slug: 'curr-matrix-transpose',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Arrays'],
    description:
      'Line 1: r c. Next r lines: c integers each. Print the transposed matrix (c rows of r ints), space-separated within rows.',
    examples: [{ input: '2 3\n1 2 3\n4 5 6', output: '1 4\n2 5\n3 6' }],
    tests: [
      { input: '2 3\n1 2 3\n4 5 6', output: '1 4\n2 5\n3 6' },
      { input: '2 2\n1 2\n3 4', output: '1 3\n2 4' },
      { input: '1 3\n7 8 9', output: '7\n8\n9' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nr, c = map(int, lines[0].split())\nm = [list(map(int, lines[i+1].split())) for i in range(r)]\n# transpose and print\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst [r, c] = lines[0].split(/\\s+/).map(Number);\nconst m = [];\nfor (let i = 0; i < r; i++) m.push(lines[i+1].split(/\\s+/).map(Number));\n// transpose\nconsole.log("");`,
      ),
      c: cMain(
        `    int r, c;\n    scanf("%d %d", &r, &c);\n    int m[100][100];\n    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) scanf("%d", &m[i][j]);\n    /* print transposed */\n    printf("\\n");`,
      ),
      cpp: cppMain(
        `    int r, c; cin >> r >> c;\n    vector<vector<int>> m(r, vector<int>(c));\n    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> m[i][j];\n    /* transpose */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int r = sc.nextInt(), c = sc.nextInt();\n        int[][] m = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = sc.nextInt();\n        /* transpose */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Merge two sorted arrays',
    slug: 'curr-merge-sorted',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Arrays', 'Sorting'],
    description:
      'Line1: M. Line2: M sorted ints. Line3: N. Line4: N sorted ints. Print merged sorted array, space-separated.',
    examples: [{ input: '3\n1 3 5\n3\n2 4 6', output: '1 2 3 4 5 6' }],
    tests: [
      { input: '3\n1 3 5\n3\n2 4 6', output: '1 2 3 4 5 6' },
      { input: '2\n1 2\n2\n3 4', output: '1 2 3 4' },
      { input: '1\n5\n1\n3', output: '3 5' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\na = list(map(int, lines[1].split()))\nb = list(map(int, lines[3].split()))\n# merge a and b\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst a = lines[1].split(/\\s+/).map(Number);\nconst b = lines[3].split(/\\s+/).map(Number);\n// merge\nconsole.log("");`,
      ),
      c: cMain(
        `    int m, n;\n    scanf("%d", &m);\n    int *a = malloc(m * sizeof(int));\n    for (int i = 0; i < m; i++) scanf("%d", &a[i]);\n    scanf("%d", &n);\n    int *b = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &b[i]);\n    /* merge */\n    printf("\\n");\n    free(a); free(b);`,
      ),
      cpp: cppMain(
        `    int m, n; cin >> m;\n    vector<int> a(m); for (auto& x : a) cin >> x;\n    cin >> n;\n    vector<int> b(n); for (auto& x : b) cin >> x;\n    /* merge */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int m = sc.nextInt();\n        int[] a = new int[m];\n        for (int i = 0; i < m; i++) a[i] = sc.nextInt();\n        int n = sc.nextInt();\n        int[] b = new int[n];\n        for (int i = 0; i < n; i++) b[i] = sc.nextInt();\n        /* merge */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Longest common prefix',
    slug: 'curr-lcp',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Strings'],
    description:
      'First line N (>=1), then N lines, one string each. Print their longest common prefix (or empty line if none).',
    examples: [{ input: '3\nflower\nflow\nflight', output: 'fl' }],
    tests: [
      { input: '3\nflower\nflow\nflight', output: 'fl' },
      { input: '2\nabc\ndef', output: '' },
      { input: '1\nhello', output: 'hello' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\nwords = lines[1:1+n]\n# find LCP\nprint("")`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst words = lines.slice(1, 1+n);\n// LCP\nconsole.log("");`,
      ),
      c: cMain(
        `    int n;\n    scanf("%d\\n", &n);\n    char words[100][256];\n    for (int i = 0; i < n; i++) { fgets(words[i], 256, stdin); words[i][strcspn(words[i],"\\n")] = 0; }\n    /* LCP */\n    printf("\\n");`,
      ),
      cpp: cppMain(
        `    int n; cin >> n; cin.ignore();\n    vector<string> w(n);\n    for (auto& s : w) getline(cin, s);\n    /* LCP */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = Integer.parseInt(sc.nextLine());\n        String[] w = new String[n];\n        for (int i = 0; i < n; i++) w[i] = sc.nextLine();\n        /* LCP */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Two sum (any pair)',
    slug: 'curr-two-sum-any',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Arrays', 'Hashing'],
    description:
      'N, then N distinct integers, then target T. Print any pair (indices, ascending) that sums to T as "i j", or "-1" if none.',
    examples: [{ input: '4\n2 7 11 15\n9', output: '0 1' }],
    tests: [
      { input: '4\n2 7 11 15\n9', output: '0 1' },
      { input: '3\n3 2 4\n6', output: '1 2' },
      { input: '3\n1 2 3\n100', output: '-1' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nt = int(lines[2])\n# hash map approach\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst t = parseInt(lines[2], 10);\n// hash\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, t;\n    scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &t);\n    /* find pair */\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, t; cin >> n;\n    vector<int> arr(n); for (auto& x : arr) cin >> x;\n    cin >> t;\n    /* unordered_map approach */\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int t = sc.nextInt();\n        /* HashMap */\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Valid parentheses',
    slug: 'curr-valid-parens',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Strings', 'Stack'],
    description: 'Read a string of () [] {}. Print "Yes" if balanced, else "No".',
    examples: [{ input: '()[]{}', output: 'Yes' }],
    tests: [
      { input: '()[]{}', output: 'Yes' },
      { input: '(]', output: 'No' },
      { input: '({[]})', output: 'Yes' },
    ],
    starters: s_oneString('Use a stack'),
  }),
  E({
    title: 'Climb stairs (1 or 2)',
    slug: 'curr-climb-stairs',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['DP'],
    description:
      'Read N (<=30). Print the number of distinct ways to climb N stairs taking 1 or 2 steps. (= F(N+1))',
    examples: [{ input: '4', output: '5' }],
    tests: [
      { input: '4', output: '5' },
      { input: '1', output: '1' },
      { input: '10', output: '89' },
    ],
    starters: s_oneInt('DP: ways(n) = ways(n-1) + ways(n-2)'),
  }),
  E({
    title: 'Max subarray (Kadane)',
    slug: 'curr-kadane',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Arrays', 'DP'],
    description: 'N then N integers. Print the maximum sum of any contiguous non-empty subarray.',
    examples: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' }],
    tests: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' },
      { input: '1\n-5', output: '-5' },
      { input: '4\n1 2 3 4', output: '10' },
    ],
    starters: s_intArrayInlineN('Kadane'),
  }),
  E({
    title: 'Stack: push, pop, peek',
    slug: 'curr-stack-ops',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Stack', 'Design'],
    description:
      'First line N (operation count). Next N lines: each is one of `push X`, `pop`, `peek`. Print the result of each `pop` and `peek` on its own line (or "empty" if the stack is empty).',
    examples: [{ input: '5\npush 1\npush 2\npeek\npop\npop', output: '2\n2\n1' }],
    tests: [
      { input: '5\npush 1\npush 2\npeek\npop\npop', output: '2\n2\n1' },
      { input: '2\npop\npeek', output: 'empty\nempty' },
      { input: '3\npush 7\npeek\npop', output: '7\n7' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\nstack = []\nout = []\nfor i in range(1, n+1):\n    parts = lines[i].split()\n    op = parts[0]\n    # implement\n    pass\nprint("\\n".join(out))`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst stack = [];\nconst out = [];\nfor (let i = 1; i <= n; i++) {\n  const [op, val] = lines[i].split(/\\s+/);\n  // implement\n}\nconsole.log(out.join('\\n'));`,
      ),
      c: cMain(`    int n; scanf("%d\\n", &n);\n    /* implement push/pop/peek */\n    `),
      cpp: cppMain(
        `    int n; cin >> n; cin.ignore();\n    stack<int> st;\n    /* implement */\n    `,
      ),
      java: javaMain(
        `        int n = Integer.parseInt(sc.nextLine());\n        Deque<Integer> st = new ArrayDeque<>();\n        /* implement */\n        `,
      ),
    },
  }),
  E({
    title: 'Queue: enqueue, dequeue, front',
    slug: 'curr-queue-ops',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Queue', 'Design'],
    description:
      'First line N. Operations: `enqueue X`, `dequeue`, `front`. Print result of each dequeue/front, or "empty".',
    examples: [{ input: '5\nenqueue 1\nenqueue 2\nfront\ndequeue\ndequeue', output: '1\n1\n2' }],
    tests: [
      { input: '5\nenqueue 1\nenqueue 2\nfront\ndequeue\ndequeue', output: '1\n1\n2' },
      { input: '2\ndequeue\nfront', output: 'empty\nempty' },
      { input: '3\nenqueue 7\nfront\ndequeue', output: '7\n7' },
    ],
    starters: {
      python: py(
        `from collections import deque\nlines = data.split("\\n")\nn = int(lines[0])\nq = deque()\nout = []\n# implement\nprint("\\n".join(out))`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst q = [];\nconst out = [];\n// implement\nconsole.log(out.join('\\n'));`,
      ),
      c: cMain(`    int n; scanf("%d\\n", &n);\n    /* implement queue */\n    `),
      cpp: cppMain(
        `    int n; cin >> n; cin.ignore();\n    queue<int> q;\n    /* implement */\n    `,
      ),
      java: javaMain(
        `        int n = Integer.parseInt(sc.nextLine());\n        Deque<Integer> q = new ArrayDeque<>();\n        /* implement */\n        `,
      ),
    },
  }),
  E({
    title: 'Insertion sort',
    slug: 'curr-insertion-sort',
    difficulty: 'medium',
    section: 'Intermediate',
    topics: ['Sorting', 'Arrays'],
    description:
      'N then N integers. Sort ascending using insertion sort. Print the result space-separated.',
    examples: [{ input: '5\n3 1 4 1 5', output: '1 1 3 4 5' }],
    tests: [
      { input: '5\n3 1 4 1 5', output: '1 1 3 4 5' },
      { input: '3\n5 4 3', output: '3 4 5' },
      { input: '1\n7', output: '7' },
    ],
    starters: s_intArrayInlineN('Implement insertion sort'),
  }),

  // ===== Hashing / Frequency (8) =====
  E({
    title: 'Contains duplicate',
    slug: 'curr-contains-duplicate',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Hashing', 'Arrays'],
    description: 'N then N integers. Print "Yes" if any value appears twice, else "No".',
    examples: [{ input: '4\n1 2 3 1', output: 'Yes' }],
    tests: [
      { input: '4\n1 2 3 1', output: 'Yes' },
      { input: '4\n1 2 3 4', output: 'No' },
      { input: '1\n7', output: 'No' },
    ],
    starters: s_intArrayInlineN('Use a set'),
  }),
  E({
    title: 'Missing number',
    slug: 'curr-missing-number',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Hashing', 'Math'],
    description: 'N then N distinct integers from 0..N (one missing). Print the missing number.',
    examples: [{ input: '3\n3 0 1', output: '2' }],
    tests: [
      { input: '3\n3 0 1', output: '2' },
      { input: '1\n0', output: '1' },
      { input: '9\n9 6 4 2 3 5 7 0 1', output: '8' },
    ],
    starters: s_intArrayInlineN('Sum 0..N minus arr sum'),
  }),
  E({
    title: 'Single number (XOR)',
    slug: 'curr-single-number',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Bit Manipulation', 'Arrays'],
    description:
      'N (odd) then N integers where every value appears twice except one. Print the unique one.',
    examples: [{ input: '5\n2 2 1 4 4', output: '1' }],
    tests: [
      { input: '5\n2 2 1 4 4', output: '1' },
      { input: '1\n7', output: '7' },
      { input: '3\n1 1 9', output: '9' },
    ],
    starters: s_intArrayInlineN('XOR all values'),
  }),
  E({
    title: 'Most frequent element',
    slug: 'curr-most-frequent',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Hashing', 'Arrays'],
    description:
      'N then N integers. Print the value that appears most often (ties broken by lower value).',
    examples: [{ input: '6\n1 2 2 3 2 1', output: '2' }],
    tests: [
      { input: '6\n1 2 2 3 2 1', output: '2' },
      { input: '3\n5 5 5', output: '5' },
      { input: '2\n1 2', output: '1' },
    ],
    starters: s_intArrayInlineN('Frequency map'),
  }),
  E({
    title: 'Two sum (sorted)',
    slug: 'curr-two-sum-sorted',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Two Pointers', 'Arrays'],
    description:
      'N then N sorted integers then target T. Print 1-indexed pair "i j" (i<j) that sums to T, or "-1".',
    examples: [{ input: '4\n2 7 11 15\n9', output: '1 2' }],
    tests: [
      { input: '4\n2 7 11 15\n9', output: '1 2' },
      { input: '3\n1 3 4\n7', output: '2 3' },
      { input: '3\n1 2 3\n100', output: '-1' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nt = int(lines[2])\n# two pointers\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst t = parseInt(lines[2], 10);\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, t; scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &t);\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, t; cin >> n;\n    vector<int> arr(n); for (auto& x : arr) cin >> x;\n    cin >> t;\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int t = sc.nextInt();\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Intersection of two arrays',
    slug: 'curr-intersection-arrays',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Hashing', 'Arrays'],
    description:
      'Four lines: M, M integers, N, N integers. Print distinct values present in BOTH, ascending, space-separated.',
    examples: [{ input: '4\n1 2 2 1\n2\n2 2', output: '2' }],
    tests: [
      { input: '4\n1 2 2 1\n2\n2 2', output: '2' },
      { input: '3\n1 2 3\n3\n3 4 5', output: '3' },
      { input: '2\n1 2\n2\n3 4', output: '' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\na = set(map(int, lines[1].split()))\nb = set(map(int, lines[3].split()))\nout = sorted(a & b)\nprint(' '.join(map(str, out)) if out else '')`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst A = new Set(lines[1].split(/\\s+/).map(Number));\nconst B = new Set(lines[3].split(/\\s+/).map(Number));\nconst out = [...A].filter((x) => B.has(x)).sort((a, b) => a - b);\nconsole.log(out.join(' '));`,
      ),
      c: cMain(`    /* TODO: read both arrays, intersect */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Word frequency',
    slug: 'curr-word-frequency',
    difficulty: 'easy',
    section: 'Hashing',
    topics: ['Hashing', 'Strings'],
    description:
      'Read one line of space-separated words. Print each distinct word with its count, ascending by word, one "word count" per line.',
    examples: [{ input: 'a b a c a b', output: 'a 3\nb 2\nc 1' }],
    tests: [
      { input: 'a b a c a b', output: 'a 3\nb 2\nc 1' },
      { input: 'hello', output: 'hello 1' },
      { input: 'foo bar baz foo bar', output: 'bar 2\nbaz 1\nfoo 2' },
    ],
    starters: s_oneString('Split, count, sort by word'),
  }),
  E({
    title: 'Top frequent element',
    slug: 'curr-top-frequent-1',
    difficulty: 'medium',
    section: 'Hashing',
    topics: ['Hashing', 'Heap'],
    description: 'N then N integers. Print the most frequent value (ties broken by lower value).',
    examples: [{ input: '6\n1 1 1 2 2 3', output: '1' }],
    tests: [
      { input: '6\n1 1 1 2 2 3', output: '1' },
      { input: '1\n7', output: '7' },
      { input: '4\n1 2 1 2', output: '1' },
    ],
    starters: s_intArrayInlineN('Frequency map + sort'),
  }),

  // ===== Sliding window (4) =====
  E({
    title: 'Max sum window of size K',
    slug: 'curr-max-sum-window-k',
    difficulty: 'medium',
    section: 'Sliding Window',
    topics: ['Sliding Window', 'Arrays'],
    description:
      'N, then N integers, then K. Print the maximum sum of any contiguous subarray of length K.',
    examples: [{ input: '5\n1 4 2 10 23\n3', output: '35' }],
    tests: [
      { input: '5\n1 4 2 10 23\n3', output: '35' },
      { input: '4\n1 2 3 4\n2', output: '7' },
      { input: '3\n5 5 5\n1', output: '5' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split()))\nk = int(lines[2])\n# sliding window\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst k = parseInt(lines[2], 10);\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, k; scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &k);\n    /* window */\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, k; cin >> n;\n    vector<int> arr(n); for (auto& x : arr) cin >> x;\n    cin >> k;\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int k = sc.nextInt();\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Longest substring without repeating',
    slug: 'curr-longest-substring-no-repeat',
    difficulty: 'medium',
    section: 'Sliding Window',
    topics: ['Sliding Window', 'Strings', 'Hashing'],
    description:
      'Read a string. Print the length of the longest substring with all distinct characters.',
    examples: [{ input: 'abcabcbb', output: '3' }],
    tests: [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
      { input: 'pwwkew', output: '3' },
    ],
    starters: s_oneString('Sliding window + set'),
  }),
  E({
    title: 'Count distinct characters in window',
    slug: 'curr-distinct-chars-window',
    difficulty: 'medium',
    section: 'Sliding Window',
    topics: ['Sliding Window', 'Strings'],
    description:
      'Two lines: a string s and integer k. Print the maximum number of distinct characters in any substring of length k.',
    examples: [{ input: 'abcabc\n3', output: '3' }],
    tests: [
      { input: 'abcabc\n3', output: '3' },
      { input: 'aaaa\n2', output: '1' },
      { input: 'abcd\n4', output: '4' },
    ],
    starters: {
      python: py(`s, k = data.split("\\n")\nk = int(k)\n# window\nprint()`),
      javascript: js(
        `const [s, kStr] = data.split(/\\n/);\nconst k = parseInt(kStr, 10);\nconsole.log("");`,
      ),
      c: cMain(
        `    char s[1024]; int k;\n    fgets(s, sizeof(s), stdin); s[strcspn(s, "\\n")] = 0;\n    scanf("%d", &k);\n    printf("\\n");`,
      ),
      cpp: cppMain(`    string s; int k;\n    getline(cin, s); cin >> k;\n    cout << endl;`),
      java: javaMain(
        `        String s = sc.nextLine();\n        int k = sc.nextInt();\n        System.out.println();`,
      ),
    },
  }),
  E({
    title: 'Window min element',
    slug: 'curr-window-min',
    difficulty: 'medium',
    section: 'Sliding Window',
    topics: ['Sliding Window', 'Arrays'],
    description:
      'N, then N integers, then K. Print K-window minimums (N-K+1 numbers space-separated).',
    examples: [{ input: '6\n4 2 12 11 -5 7\n3', output: '2 2 -5 -5' }],
    tests: [
      { input: '6\n4 2 12 11 -5 7\n3', output: '2 2 -5 -5' },
      { input: '3\n1 2 3\n2', output: '1 2' },
      { input: '3\n5 5 5\n3', output: '5' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\narr = list(map(int, lines[1].split()))\nk = int(lines[2])\n# brute force OK for small N\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst arr = lines[1].split(/\\s+/).map(Number);\nconst k = parseInt(lines[2], 10);\nconsole.log("");`,
      ),
      c: cMain(
        `    int n, k; scanf("%d", &n);\n    int *arr = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &k);\n    printf("\\n");\n    free(arr);`,
      ),
      cpp: cppMain(
        `    int n, k; cin >> n;\n    vector<int> arr(n); for (auto& x : arr) cin >> x;\n    cin >> k;\n    cout << endl;`,
      ),
      java: javaMain(
        `        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int k = sc.nextInt();\n        System.out.println();`,
      ),
    },
  }),

  // ===== Stack patterns (4) =====
  E({
    title: 'Min stack length',
    slug: 'curr-min-stack-length',
    difficulty: 'medium',
    section: 'Stack',
    topics: ['Stack', 'Design'],
    description:
      'N then N ops: `push X`, `pop`, `min`. Print the result of each `min` (current min of the stack) or "empty".',
    examples: [{ input: '5\npush 3\npush 1\nmin\npop\nmin', output: '1\n3' }],
    tests: [
      { input: '5\npush 3\npush 1\nmin\npop\nmin', output: '1\n3' },
      { input: '3\npush 5\nmin\npop', output: '5' },
      { input: '1\nmin', output: 'empty' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\nn = int(lines[0])\nstack, mins, out = [], [], []\n# maintain prefix-min on push\nprint("\\n".join(out))`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst n = parseInt(lines[0], 10);\nconst stack = [], mins = [], out = [];\nconsole.log(out.join('\\n'));`,
      ),
      c: cMain(`    int n; scanf("%d\\n", &n);\n    /* implement */\n    `),
      cpp: cppMain(`    int n; cin >> n; cin.ignore();\n    cout << "";\n    `),
      java: javaMain(
        `        int n = Integer.parseInt(sc.nextLine());\n        /* implement */\n        `,
      ),
    },
  }),
  E({
    title: 'Evaluate postfix expression',
    slug: 'curr-eval-postfix',
    difficulty: 'medium',
    section: 'Stack',
    topics: ['Stack', 'Math'],
    description:
      'Read one line of space-separated tokens: integers and operators (+ - * /). Evaluate the postfix expression and print the integer result (truncate toward zero).',
    examples: [{ input: '2 3 +', output: '5' }],
    tests: [
      { input: '2 3 +', output: '5' },
      { input: '5 1 2 + 4 * + 3 -', output: '14' },
      { input: '10 2 /', output: '5' },
    ],
    starters: s_oneString('Use a stack of integers'),
  }),
  E({
    title: 'Next greater element',
    slug: 'curr-next-greater',
    difficulty: 'medium',
    section: 'Stack',
    topics: ['Stack', 'Arrays'],
    description:
      'N then N integers. For each element, print the next greater element to its right (or -1). Space-separated on one line.',
    examples: [{ input: '4\n4 5 2 25', output: '5 25 25 -1' }],
    tests: [
      { input: '4\n4 5 2 25', output: '5 25 25 -1' },
      { input: '3\n1 2 3', output: '2 3 -1' },
      { input: '1\n7', output: '-1' },
    ],
    starters: s_intArrayInlineN('Monotonic stack from right to left'),
  }),
  E({
    title: 'Daily temperatures',
    slug: 'curr-daily-temps',
    difficulty: 'medium',
    section: 'Stack',
    topics: ['Stack', 'Arrays'],
    description:
      'N then N integers (temperatures). For each day, print how many days until a warmer temperature (0 if none).',
    examples: [{ input: '8\n73 74 75 71 69 72 76 73', output: '1 1 4 2 1 1 0 0' }],
    tests: [
      { input: '8\n73 74 75 71 69 72 76 73', output: '1 1 4 2 1 1 0 0' },
      { input: '4\n30 40 50 60', output: '1 1 1 0' },
      { input: '1\n30', output: '0' },
    ],
    starters: s_intArrayInlineN('Monotonic decreasing stack'),
  }),

  // ===== DP / Greedy (6) =====
  E({
    title: 'House robber',
    slug: 'curr-house-robber',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP', 'Arrays'],
    description:
      'N then N non-negative integers (house values). Cannot rob adjacent houses. Print max loot.',
    examples: [{ input: '4\n1 2 3 1', output: '4' }],
    tests: [
      { input: '4\n1 2 3 1', output: '4' },
      { input: '5\n2 7 9 3 1', output: '12' },
      { input: '1\n5', output: '5' },
    ],
    starters: s_intArrayInlineN('DP: dp[i] = max(dp[i-1], dp[i-2]+a[i])'),
  }),
  E({
    title: 'Coin change min coins',
    slug: 'curr-coin-change-min',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP'],
    description:
      'Two lines: a space-separated list of coin denominations, then target amount T. Print min coins needed, or -1.',
    examples: [{ input: '1 2 5\n11', output: '3' }],
    tests: [
      { input: '1 2 5\n11', output: '3' },
      { input: '2\n3', output: '-1' },
      { input: '1\n0', output: '0' },
    ],
    starters: {
      python: py(
        `lines = data.split("\\n")\ncoins = list(map(int, lines[0].split()))\nt = int(lines[1])\n# DP\nprint()`,
      ),
      javascript: js(
        `const lines = data.split(/\\n/);\nconst coins = lines[0].split(/\\s+/).map(Number);\nconst t = parseInt(lines[1], 10);\nconsole.log("");`,
      ),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),
  E({
    title: 'Unique paths in grid',
    slug: 'curr-unique-paths',
    difficulty: 'medium',
    section: 'DP',
    topics: ['DP'],
    description:
      'Read m and n. Print number of unique paths from top-left to bottom-right (right or down only).',
    examples: [{ input: '3 7', output: '28' }],
    tests: [
      { input: '3 7', output: '28' },
      { input: '3 2', output: '3' },
      { input: '1 1', output: '1' },
    ],
    starters: s_twoInt('DP table or formula'),
  }),
  E({
    title: 'Longest increasing subsequence',
    slug: 'curr-lis',
    difficulty: 'hard',
    section: 'DP',
    topics: ['DP'],
    description:
      'N then N integers. Print the length of the longest strictly increasing subsequence.',
    examples: [{ input: '8\n10 9 2 5 3 7 101 18', output: '4' }],
    tests: [
      { input: '8\n10 9 2 5 3 7 101 18', output: '4' },
      { input: '6\n0 1 0 3 2 3', output: '4' },
      { input: '4\n7 7 7 7', output: '1' },
    ],
    starters: s_intArrayInlineN('Patience sort or O(n log n)'),
  }),
  E({
    title: 'Jump game (reach last index)',
    slug: 'curr-jump-game',
    difficulty: 'medium',
    section: 'DP',
    topics: ['Greedy', 'Arrays'],
    description:
      'N then N non-negative integers (max jump from each). Print "Yes" if you can reach the last index, else "No".',
    examples: [{ input: '5\n2 3 1 1 4', output: 'Yes' }],
    tests: [
      { input: '5\n2 3 1 1 4', output: 'Yes' },
      { input: '5\n3 2 1 0 4', output: 'No' },
      { input: '1\n0', output: 'Yes' },
    ],
    starters: s_intArrayInlineN('Greedy: track max reachable'),
  }),
  E({
    title: 'Best time to buy and sell',
    slug: 'curr-best-buy-sell',
    difficulty: 'easy',
    section: 'DP',
    topics: ['Arrays', 'DP'],
    description:
      'N then N integers (prices on each day). Print max profit from one buy + one later sell. 0 if impossible.',
    examples: [{ input: '6\n7 1 5 3 6 4', output: '5' }],
    tests: [
      { input: '6\n7 1 5 3 6 4', output: '5' },
      { input: '5\n7 6 4 3 1', output: '0' },
      { input: '1\n5', output: '0' },
    ],
    starters: s_intArrayInlineN('Track running min'),
  }),

  // ===== Bit Manipulation (4) =====
  E({
    title: 'Count set bits',
    slug: 'curr-count-set-bits',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation'],
    description:
      'Read a non-negative integer N (<= 2^31 - 1). Print the count of 1-bits in its binary representation.',
    examples: [{ input: '11', output: '3' }],
    tests: [
      { input: '11', output: '3' },
      { input: '128', output: '1' },
      { input: '0', output: '0' },
    ],
    starters: s_oneInt('n & (n-1) trick'),
  }),
  E({
    title: 'Power of two',
    slug: 'curr-power-of-two-bit',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation'],
    description: 'Read N. Print "Yes" if N is a power of 2, else "No".',
    examples: [{ input: '16', output: 'Yes' }],
    tests: [
      { input: '16', output: 'Yes' },
      { input: '6', output: 'No' },
      { input: '1', output: 'Yes' },
    ],
    starters: s_oneInt('N > 0 and N & (N-1) == 0'),
  }),
  E({
    title: 'XOR of range 0..N',
    slug: 'curr-xor-range',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Bit Manipulation', 'Math'],
    description: 'Read N. Print 0 XOR 1 XOR 2 XOR ... XOR N.',
    examples: [{ input: '5', output: '1' }],
    tests: [
      { input: '5', output: '1' },
      { input: '4', output: '4' },
      { input: '1', output: '1' },
    ],
    starters: s_oneInt('Pattern: cycle of length 4'),
  }),
  E({
    title: 'Add two binary strings',
    slug: 'curr-add-binary',
    difficulty: 'easy',
    section: 'Bit Manipulation',
    topics: ['Strings', 'Math'],
    description:
      'Two lines: binary strings a and b. Print their sum as a binary string (no leading zeros, "0" if both zero).',
    examples: [{ input: '11\n1', output: '100' }],
    tests: [
      { input: '11\n1', output: '100' },
      { input: '1010\n1011', output: '10101' },
      { input: '0\n0', output: '0' },
    ],
    starters: {
      python: py(`a, b = data.split("\\n")\nprint(bin(int(a, 2) + int(b, 2))[2:])`),
      javascript: js(`const [a, b] = data.split(/\\n/);\nconsole.log("");`),
      c: cMain(`    /* TODO */\n    printf("\\n");`),
      cpp: cppMain(`    /* TODO */\n    cout << endl;`),
      java: javaMain(`        /* TODO */\n        System.out.println();`),
    },
  }),

  // ===== Misc (4) =====
  E({
    title: 'Pascal triangle row',
    slug: 'curr-pascal-row',
    difficulty: 'easy',
    section: 'Math',
    topics: ['Math'],
    description: "Read N (>=0, <=30). Print row N of Pascal's triangle, space-separated.",
    examples: [{ input: '4', output: '1 4 6 4 1' }],
    tests: [
      { input: '4', output: '1 4 6 4 1' },
      { input: '0', output: '1' },
      { input: '5', output: '1 5 10 10 5 1' },
    ],
    starters: s_oneInt('Build incrementally'),
  }),
  E({
    title: 'Happy number',
    slug: 'curr-happy-number',
    difficulty: 'medium',
    section: 'Math',
    topics: ['Hashing', 'Math'],
    description:
      'Read N. Print "Yes" if repeatedly replacing N with the sum of the squares of its digits eventually reaches 1, else "No".',
    examples: [{ input: '19', output: 'Yes' }],
    tests: [
      { input: '19', output: 'Yes' },
      { input: '2', output: 'No' },
      { input: '1', output: 'Yes' },
    ],
    starters: s_oneInt('Use set to detect cycles'),
  }),
  E({
    title: 'Excel column number',
    slug: 'curr-excel-col-num',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings', 'Math'],
    description:
      'Read a column title like "AB". Print its 1-indexed column number (A=1, Z=26, AA=27, AB=28).',
    examples: [{ input: 'AB', output: '28' }],
    tests: [
      { input: 'A', output: '1' },
      { input: 'AB', output: '28' },
      { input: 'ZY', output: '701' },
    ],
    starters: s_oneString('Base-26 conversion'),
  }),
  E({
    title: 'Roman to integer',
    slug: 'curr-roman-to-int',
    difficulty: 'easy',
    section: 'Strings',
    topics: ['Strings', 'Hashing'],
    description: 'Read a roman numeral string (I,V,X,L,C,D,M). Print its integer value.',
    examples: [{ input: 'IX', output: '9' }],
    tests: [
      { input: 'IX', output: '9' },
      { input: 'LVIII', output: '58' },
      { input: 'MCMXCIV', output: '1994' },
    ],
    starters: s_oneString('Subtract when smaller before larger'),
  }),
];
