/* eslint-disable no-console */
// Round 2 of MCQ padding: ~4 more questions per existing track so each reaches
// the 15-20 target. Idempotent (upsert by slug). Re-runnable.
import { PrismaClient } from '@prisma/client';

type Mcq = {
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  domain: string;
  description: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

const Q: Mcq[] = [
  // ---------------- Law ----------------
  {
    slug: 'y-law-tort-crime',
    title: 'Tort vs Crime',
    difficulty: 'medium',
    topics: ['Legal Concepts'],
    domain: 'law',
    description: 'The key difference between a tort and a crime is that:',
    options: [
      'A tort is a wrong against an individual (civil); a crime is a wrong against the state (public).',
      'A tort is more serious than a crime.',
      'Only crimes can result in compensation.',
      'There is no difference.',
    ],
    correctOption: 0,
    explanation:
      'A tort is a civil wrong against a private individual, remedied by damages. A crime is a public wrong against society, prosecuted by the state and punishable by fine/imprisonment.',
  },
  {
    slug: 'y-law-quasi-contract',
    title: 'Quasi-Contract',
    difficulty: 'medium',
    topics: ['Contract Law'],
    domain: 'law',
    description: 'A quasi-contract is best described as:',
    options: [
      'A written contract signed by both parties',
      'An obligation imposed by law to prevent unjust enrichment, without an actual agreement',
      'A contract that is void',
      'An oral agreement',
    ],
    correctOption: 1,
    explanation:
      "A quasi-contract is not a real contract; it is an obligation the law imposes to prevent one party from being unjustly enriched at another's expense (e.g. paying for goods delivered by mistake).",
  },
  {
    slug: 'y-law-article-14',
    title: 'Right to Equality',
    difficulty: 'easy',
    topics: ['Constitutional Law'],
    domain: 'law',
    description: 'Article 14 of the Indian Constitution guarantees:',
    options: [
      'Freedom of speech',
      'Equality before the law and equal protection of the laws',
      'Right to property',
      'Right to education',
    ],
    correctOption: 1,
    explanation:
      'Article 14 guarantees equality before the law and equal protection of the laws to every person within India.',
  },
  {
    slug: 'y-law-specific-performance',
    title: 'Specific Performance',
    difficulty: 'hard',
    topics: ['Civil Litigation'],
    domain: 'law',
    description: 'Specific performance is a remedy where the court:',
    options: [
      'Awards monetary damages only',
      'Orders a party to actually perform their contractual obligation',
      'Cancels the contract',
      'Sends a party to prison',
    ],
    correctOption: 1,
    explanation:
      'Specific performance is an equitable remedy compelling a party to perform the contract itself (common where damages are inadequate, e.g. sale of a unique property), rather than merely paying damages.',
  },

  // ---------------- Commerce ----------------
  {
    slug: 'y-com-trial-balance',
    title: 'Trial Balance',
    difficulty: 'easy',
    topics: ['Financial Accounting'],
    domain: 'commerce',
    description: 'The main purpose of preparing a trial balance is to:',
    options: [
      'Calculate net profit',
      'Check the arithmetical accuracy of the ledger (debits = credits)',
      'Determine the cash balance',
      'Value the closing stock',
    ],
    correctOption: 1,
    explanation:
      'A trial balance lists all ledger balances to verify that total debits equal total credits — a check on the arithmetical accuracy of the books. Profit is found via the P&L account.',
  },
  {
    slug: 'y-com-capital-revenue',
    title: 'Capital vs Revenue Expenditure',
    difficulty: 'medium',
    topics: ['Accounting'],
    domain: 'commerce',
    description: 'Purchasing a delivery van for the business is an example of:',
    options: [
      'Revenue expenditure',
      'Capital expenditure',
      'Deferred revenue expenditure',
      'An operating expense',
    ],
    correctOption: 1,
    explanation:
      'Buying a long-lived asset like a van is capital expenditure (benefits span many years, recorded as an asset). Fuel and repairs for the van would be revenue expenditure.',
  },
  {
    slug: 'y-com-current-ratio-2',
    title: 'Quick Ratio',
    difficulty: 'medium',
    topics: ['Financial Analysis'],
    domain: 'commerce',
    description: 'The quick (acid-test) ratio differs from the current ratio because it excludes:',
    options: ['Cash', 'Inventory (and prepaid expenses)', 'Receivables', 'Current liabilities'],
    correctOption: 1,
    explanation:
      'The quick ratio = (current assets − inventory − prepaid expenses) / current liabilities. It excludes inventory because stock is the least liquid current asset.',
  },
  {
    slug: 'y-com-cash-vs-accrual',
    title: 'Accrual Basis',
    difficulty: 'medium',
    topics: ['Accounting Principles'],
    domain: 'commerce',
    description: 'Under the accrual basis of accounting, revenue is recognised when:',
    options: [
      'Cash is received',
      'It is earned, regardless of when cash is received',
      'The financial year ends',
      'The invoice is paid',
    ],
    correctOption: 1,
    explanation:
      'Accrual accounting recognises revenue when earned and expenses when incurred, irrespective of cash flow. Cash-basis accounting records them only when cash changes hands.',
  },

  // ---------------- Management ----------------
  {
    slug: 'y-mgmt-herzberg',
    title: 'Herzberg Two-Factor',
    difficulty: 'medium',
    topics: ['Organizational Behavior'],
    domain: 'management',
    description:
      'In Herzberg\'s two-factor theory, "hygiene factors" (e.g. salary, working conditions):',
    options: [
      'Motivate employees to excel',
      'Do not motivate, but their absence causes dissatisfaction',
      'Are the same as motivators',
      'Are irrelevant to job satisfaction',
    ],
    correctOption: 1,
    explanation:
      'Hygiene factors (pay, conditions, policies) do not motivate; their absence causes dissatisfaction. Motivators (achievement, recognition, growth) drive satisfaction and effort.',
  },
  {
    slug: 'y-mgmt-ansoff',
    title: 'Ansoff Matrix',
    difficulty: 'medium',
    topics: ['Strategy'],
    domain: 'management',
    description: 'Selling existing products to new markets in the Ansoff matrix is called:',
    options: ['Market penetration', 'Market development', 'Product development', 'Diversification'],
    correctOption: 1,
    explanation:
      'Ansoff matrix: existing product + new market = Market development. (Existing/existing = penetration; new product/existing market = product development; new/new = diversification.)',
  },
  {
    slug: 'y-mgmt-delegation',
    title: 'Delegation',
    difficulty: 'easy',
    topics: ['Management Principles'],
    domain: 'management',
    description: 'When a manager delegates authority, they:',
    options: [
      'Transfer the final accountability to the subordinate',
      'Assign authority to a subordinate but remain accountable for the outcome',
      'Lose all control over the task',
      'No longer need to supervise',
    ],
    correctOption: 1,
    explanation:
      'Delegation transfers authority and responsibility for a task to a subordinate, but the manager retains ultimate accountability — accountability cannot be delegated away.',
  },
  {
    slug: 'y-mgmt-jit',
    title: 'Just-in-Time',
    difficulty: 'medium',
    topics: ['Operations'],
    domain: 'management',
    description: 'The Just-in-Time (JIT) inventory system aims to:',
    options: [
      'Hold large buffer stocks',
      'Minimise inventory by receiving goods only as needed in production',
      'Maximise warehouse space',
      'Order in bulk to get discounts',
    ],
    correctOption: 1,
    explanation:
      'JIT minimises inventory holding by receiving materials just as they are needed, cutting carrying costs and waste — but it depends on reliable suppliers and demand.',
  },

  // ---------------- Aptitude ----------------
  {
    slug: 'y-apt-boats',
    title: 'Boats and Streams',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'A boat goes 12 km/h in still water; the stream flows at 3 km/h. What is its downstream speed?',
    options: ['9 km/h', '12 km/h', '15 km/h', '36 km/h'],
    correctOption: 2,
    explanation:
      'Downstream speed = boat speed + stream speed = 12 + 3 = 15 km/h. (Upstream would be 12 − 3 = 9 km/h.)',
  },
  {
    slug: 'y-apt-ages',
    title: 'Problems on Ages',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'A father is 3 times as old as his son. In 12 years, he will be twice as old. How old is the son now?',
    options: ['10', '12', '14', '16'],
    correctOption: 1,
    explanation:
      'Let son = x, father = 3x. In 12 years: 3x + 12 = 2(x + 12) → 3x + 12 = 2x + 24 → x = 12. The son is 12.',
  },
  {
    slug: 'y-apt-pipes',
    title: 'Pipes and Cisterns',
    difficulty: 'hard',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'Pipe A fills a tank in 6 hours, pipe B in 12 hours. Working together, how long to fill it?',
    options: ['3 hours', '4 hours', '8 hours', '9 hours'],
    correctOption: 1,
    explanation:
      'Combined rate = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4 tank per hour. So together they fill it in 4 hours.',
  },
  {
    slug: 'y-apt-simple-eq',
    title: 'Discount',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'A shirt marked at ₹800 is sold at a 25% discount. What is the selling price?',
    options: ['₹575', '₹600', '₹620', '₹650'],
    correctOption: 1,
    explanation: 'Discount = 25% of 800 = ₹200. Selling price = 800 − 200 = ₹600.',
  },

  // ---------------- English ----------------
  {
    slug: 'y-eng-tense',
    title: 'Correct Tense',
    difficulty: 'medium',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Choose the correct sentence:',
    options: [
      'He has went to the market.',
      'He has gone to the market.',
      'He have gone to the market.',
      'He is went to the market.',
    ],
    correctOption: 1,
    explanation:
      'The present perfect uses "has/have + past participle". The past participle of "go" is "gone", so "He has gone to the market." is correct.',
  },
  {
    slug: 'y-eng-antonym-2',
    title: 'Antonym',
    difficulty: 'easy',
    topics: ['Vocabulary'],
    domain: 'english',
    description: "Choose the word most OPPOSITE in meaning to 'TRANSPARENT':",
    options: ['Clear', 'Opaque', 'Honest', 'Visible'],
    correctOption: 1,
    explanation:
      "'Transparent' means see-through/clear. Its opposite is 'opaque' (not able to be seen through).",
  },
  {
    slug: 'y-eng-spelling',
    title: 'Spelling',
    difficulty: 'easy',
    topics: ['Vocabulary'],
    domain: 'english',
    description: 'Which word is spelled correctly?',
    options: ['Accomodate', 'Accommodate', 'Acommodate', 'Accommadate'],
    correctOption: 1,
    explanation: "'Accommodate' has double-c and double-m — a commonly misspelled word.",
  },
  {
    slug: 'y-eng-prep-2',
    title: 'Preposition',
    difficulty: 'easy',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Fill in the blank: "She is good ___ mathematics."',
    options: ['in', 'at', 'on', 'with'],
    correctOption: 1,
    explanation:
      "The fixed expression is 'good at' a subject or skill — 'She is good at mathematics.'",
  },

  // ---------------- General Knowledge ----------------
  {
    slug: 'y-gk-mountain',
    title: 'World Geography',
    difficulty: 'easy',
    topics: ['Geography'],
    domain: 'general-knowledge',
    description: 'What is the tallest mountain in the world (above sea level)?',
    options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Makalu'],
    correctOption: 2,
    explanation:
      'Mount Everest (8,849 m) is the highest mountain above sea level, on the Nepal–China border.',
  },
  {
    slug: 'y-gk-national',
    title: 'National Symbols',
    difficulty: 'easy',
    topics: ['India GK'],
    domain: 'general-knowledge',
    description: 'What is the national animal of India?',
    options: ['Lion', 'Bengal Tiger', 'Elephant', 'Peacock'],
    correctOption: 1,
    explanation:
      'The Royal Bengal Tiger is the national animal of India. (The peacock is the national bird.)',
  },
  {
    slug: 'y-gk-light',
    title: 'Science Basics',
    difficulty: 'medium',
    topics: ['Physics'],
    domain: 'general-knowledge',
    description: 'The speed of light in vacuum is approximately:',
    options: ['3 × 10⁵ km/s', '3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s'],
    correctOption: 1,
    explanation: 'Light travels at about 3 × 10⁸ metres per second (≈ 300,000 km/s) in a vacuum.',
  },
  {
    slug: 'y-gk-un',
    title: 'World Organizations',
    difficulty: 'easy',
    topics: ['Current Affairs'],
    domain: 'general-knowledge',
    description: 'Where is the headquarters of the United Nations located?',
    options: ['Geneva', 'New York', 'Paris', 'Vienna'],
    correctOption: 1,
    explanation:
      'The UN headquarters is in New York City, USA. (Geneva, Vienna and others host major UN offices.)',
  },

  // ---------------- Logical Reasoning ----------------
  {
    slug: 'y-lr-venn',
    title: 'Venn Diagram Logic',
    difficulty: 'medium',
    topics: ['Logical Reasoning'],
    domain: 'logical-reasoning',
    description: 'Which best represents the relationship: Doctors, Women, Mothers?',
    options: [
      'Three completely separate groups',
      'All overlap partially (some women are doctors, some mothers are doctors, all mothers are women)',
      'One circle inside another inside another',
      'Mothers and doctors are the same set',
    ],
    correctOption: 1,
    explanation:
      'All mothers are women (mothers ⊂ women). Doctors overlap with both (some women and some mothers are doctors), but not all. So they partially overlap with mothers inside women.',
  },
  {
    slug: 'y-lr-series-mixed',
    title: 'Alpha-Numeric Series',
    difficulty: 'medium',
    topics: ['Series'],
    domain: 'logical-reasoning',
    description: 'Find the next term: 2A, 4B, 8C, 16D, ?',
    options: ['24E', '32E', '32D', '20E'],
    correctOption: 1,
    explanation:
      'The numbers double (2, 4, 8, 16, 32) and the letters advance (A, B, C, D, E). So the next term is 32E.',
  },
  {
    slug: 'y-lr-ranking',
    title: 'Ranking',
    difficulty: 'medium',
    topics: ['Logical Reasoning'],
    domain: 'logical-reasoning',
    description:
      'In a row of 25 students, Raj is 7th from the left. What is his position from the right?',
    options: ['18th', '19th', '17th', '20th'],
    correctOption: 1,
    explanation: 'Position from right = total − position from left + 1 = 25 − 7 + 1 = 19th.',
  },
  {
    slug: 'y-lr-cause-effect',
    title: 'Assertion & Reason',
    difficulty: 'hard',
    topics: ['Logical Deduction'],
    domain: 'logical-reasoning',
    description:
      'Statement: The school declared a holiday. Which is a likely CAUSE rather than an effect?',
    options: [
      'Students stayed home',
      'A severe cyclone warning was issued for the city',
      'The playground was empty',
      'Teachers did not come',
    ],
    correctOption: 1,
    explanation:
      'A cyclone warning is a plausible cause of the holiday; the other options (students home, empty playground, teachers absent) are effects of the holiday being declared.',
  },

  // ---------------- Data Interpretation ----------------
  {
    slug: 'y-di-line-trend',
    title: 'Line Graph Trend',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Website visitors (thousands): Jan 20, Feb 25, Mar 30, Apr 28, May 35. In which month was the highest month-on-month INCREASE?',
    options: ['February', 'March', 'April', 'May'],
    correctOption: 3,
    explanation:
      'Month-on-month increases: Feb +5, Mar +5, Apr −2, May +7. The largest increase is +7, in May.',
  },
  {
    slug: 'y-di-combined-avg',
    title: 'Combined Average',
    difficulty: 'hard',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Class A (20 students) averages 60 marks; Class B (30 students) averages 70. What is the combined average?',
    options: ['64', '65', '66', '67'],
    correctOption: 2,
    explanation:
      'Total marks = 20×60 + 30×70 = 1200 + 2100 = 3300. Combined average = 3300 / 50 = 66.',
  },
  {
    slug: 'y-di-table-pct',
    title: 'Table: Percentage',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description: 'Of 1,200 applicants, 480 were shortlisted. What percentage were NOT shortlisted?',
    options: ['40%', '50%', '60%', '70%'],
    correctOption: 2,
    explanation: 'Not shortlisted = 1,200 − 480 = 720. Percentage = 720 / 1,200 × 100 = 60%.',
  },
  {
    slug: 'y-di-ratio-compare',
    title: 'Comparing Shares',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Expenses (₹): Rent 8,000, Food 6,000, Travel 2,000, Other 4,000. What fraction of total is Rent?',
    options: ['1/2', '2/5', '1/3', '3/10'],
    correctOption: 1,
    explanation:
      'Total = 8,000 + 6,000 + 2,000 + 4,000 = 20,000. Rent share = 8,000 / 20,000 = 2/5.',
  },

  // ---------------- Banking & Finance ----------------
  {
    slug: 'y-bank-slr',
    title: 'SLR',
    difficulty: 'medium',
    topics: ['Banking Regulation'],
    domain: 'banking',
    description:
      'The Statutory Liquidity Ratio (SLR) is the portion of deposits banks must hold as:',
    options: [
      'Cash with the RBI',
      'Liquid assets (cash, gold, approved securities) with themselves',
      'Loans to the government',
      'Foreign currency',
    ],
    correctOption: 1,
    explanation:
      "SLR is the minimum percentage of a bank's deposits it must maintain in liquid assets (cash, gold, approved government securities) with itself, before lending. CRR, by contrast, is held as cash with the RBI.",
  },
  {
    slug: 'y-bank-jan-dhan',
    title: 'Financial Inclusion',
    difficulty: 'easy',
    topics: ['Government Schemes'],
    domain: 'banking',
    description: 'The Pradhan Mantri Jan Dhan Yojana (PMJDY) primarily aims to:',
    options: [
      'Provide pensions to the elderly',
      'Bring unbanked households into the formal banking system with zero-balance accounts',
      'Offer crop insurance',
      'Subsidise home loans',
    ],
    correctOption: 1,
    explanation:
      'PMJDY is a financial-inclusion scheme providing basic, zero-balance bank accounts (with RuPay card, overdraft and insurance) to unbanked households.',
  },
  {
    slug: 'y-bank-deposit-types',
    title: 'Types of Deposits',
    difficulty: 'easy',
    topics: ['Banking Products'],
    domain: 'banking',
    description: 'A savings account is an example of a:',
    options: ['Term deposit', 'Demand deposit', 'Recurring deposit', 'Fixed deposit'],
    correctOption: 1,
    explanation:
      'A demand deposit (savings or current account) can be withdrawn on demand at any time. A term/fixed deposit is locked for a set period.',
  },
  {
    slug: 'y-bank-cheque',
    title: 'Cheques',
    difficulty: 'medium',
    topics: ['Banking Instruments'],
    domain: 'banking',
    description: 'A "crossed cheque" (two parallel lines on the top-left) means it:',
    options: [
      'Can be cashed over the counter',
      'Must be paid into a bank account, not paid in cash over the counter',
      'Is cancelled',
      'Has bounced',
    ],
    correctOption: 1,
    explanation:
      'Crossing a cheque (two parallel lines) directs that it be credited to a bank account rather than paid in cash over the counter — a safeguard against fraud.',
  },
];

async function main() {
  const p = new PrismaClient();
  const slugs = [
    'law',
    'commerce',
    'management',
    'aptitude',
    'english',
    'general-knowledge',
    'logical-reasoning',
    'data-interpretation',
    'banking',
  ];
  const domainId: Record<string, string> = {};
  for (const slug of slugs) {
    const row = await p.practiceDomain.findUnique({ where: { slug } });
    if (row) domainId[slug] = row.id;
  }

  let n = 0;
  for (const q of Q) {
    const did = domainId[q.domain];
    if (!did) {
      console.warn(`No domain "${q.domain}" (${q.slug}) — skipping.`);
      continue;
    }
    await p.problem.upsert({
      where: { slug: q.slug },
      update: {
        title: q.title,
        difficulty: q.difficulty,
        topics: q.topics,
        description: q.description,
        kind: 'mcq',
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        examplesJson: [],
        points: 10,
        domains: { set: [{ id: did }] },
      },
      create: {
        slug: q.slug,
        title: q.title,
        difficulty: q.difficulty,
        topics: q.topics,
        description: q.description,
        kind: 'mcq',
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        examplesJson: [],
        points: 10,
        domains: { connect: [{ id: did }] },
      },
    });
    n += 1;
  }
  console.log(`Done. ${n} MCQs upserted across ${slugs.length} tracks.`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
