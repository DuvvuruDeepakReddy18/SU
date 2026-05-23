/* eslint-disable no-console */
// Seeds the practice problems with starter code that demonstrates the expected
// stdin/stdout pattern. The seed inputs are space-or-newline separated lists,
// e.g. for two-sum: "[2,7,11,15] 9" → array + target.
import { PrismaClient } from '@prisma/client';

const TWO_SUM_PY = `import sys, re
line = sys.stdin.read().strip()
arr_str, target_str = line.rsplit(' ', 1)
arr = list(map(int, re.findall(r'-?\\d+', arr_str)))
target = int(target_str)
seen = {}
for i, n in enumerate(arr):
    if target - n in seen:
        print(f'[{seen[target-n]},{i}]')
        break
    seen[n] = i
`;

const GENERIC_PY = `import sys
data = sys.stdin.read().strip()
# Parse 'data' according to the problem statement, compute, print result.
print(data)
`;

const GENERIC_JS = `let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  // parse 'data' according to the problem statement, compute, write to stdout
  process.stdout.write(data.trim());
});
`;

const GENERIC_CPP = `#include <bits/stdc++.h>
using namespace std;
int main() {
  string line;
  getline(cin, line);
  // parse 'line', compute, print result
  cout << line;
  return 0;
}
`;

const GENERIC_JAVA = `import java.util.*;
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String line = sc.nextLine();
    // parse 'line', compute, print
    System.out.println(line);
  }
}
`;

async function main() {
  const p = new PrismaClient();
  const generic = {
    python: GENERIC_PY,
    javascript: GENERIC_JS,
    cpp: GENERIC_CPP,
    java: GENERIC_JAVA,
  };

  // Update ALL problems with the generic starter pattern so users know the
  // stdin/stdout convention.
  const all = await p.problem.findMany({ select: { id: true, slug: true } });
  for (const prob of all) {
    await p.problem.update({ where: { id: prob.id }, data: { starterCode: generic } });
  }
  console.log(`updated ${all.length} problems with stdin/stdout starter patterns`);

  // Special-case two-sum with a fully working Python sample (good demo for AC).
  await p.problem.update({
    where: { slug: 'two-sum' },
    data: {
      starterCode: { ...generic, python: TWO_SUM_PY },
    },
  });
  console.log('two-sum: Python starter is a working AC solution');

  await p.$disconnect();
}
main();
