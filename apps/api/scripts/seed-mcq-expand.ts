/* eslint-disable no-console */
// Expands the MCQ practice library: 3 new tracks (Logical Reasoning, Data
// Interpretation, Banking & Financial Awareness) + padding for the existing
// tracks so each reaches ~15 questions. Reuses the kind="mcq" engine.
// Idempotent (upsert by slug). Re-runnable.
import { PrismaClient } from '@prisma/client';

const DOMAINS = [
  { slug: 'logical-reasoning', name: 'Logical Reasoning', icon: 'Network', sortOrder: 25 },
  { slug: 'data-interpretation', name: 'Data Interpretation', icon: 'BarChart3', sortOrder: 26 },
  { slug: 'banking', name: 'Banking & Finance', icon: 'Banknote', sortOrder: 27 },
];

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
  // ---------------- Logical Reasoning (new) ----------------
  {
    slug: 'x-lr-syllogism',
    title: 'Syllogism',
    difficulty: 'medium',
    topics: ['Syllogisms'],
    domain: 'logical-reasoning',
    description:
      'Statements: All pens are books. All books are tables. Which conclusion definitely follows?',
    options: [
      'All tables are pens.',
      'All pens are tables.',
      'Some pens are not tables.',
      'No book is a table.',
    ],
    correctOption: 1,
    explanation:
      'All pens are books and all books are tables, so all pens are tables (the chain holds). The reverse ("all tables are pens") is not guaranteed.',
  },
  {
    slug: 'x-lr-blood-relation',
    title: 'Blood Relations',
    difficulty: 'medium',
    topics: ['Blood Relations'],
    domain: 'logical-reasoning',
    description:
      'Pointing to a man, Reena said, "He is the son of my grandfather\'s only son." How is the man related to Reena?',
    options: ['Father', 'Brother', 'Uncle', 'Cousin'],
    correctOption: 1,
    explanation:
      "Reena's grandfather's only son is Reena's father. The man is that father's son, i.e. Reena's brother.",
  },
  {
    slug: 'x-lr-coding',
    title: 'Coding–Decoding',
    difficulty: 'easy',
    topics: ['Coding-Decoding'],
    domain: 'logical-reasoning',
    description: 'If CAT is coded as DBU, how is DOG coded?',
    options: ['EPH', 'EPG', 'FPH', 'DPH'],
    correctOption: 0,
    explanation: 'Each letter shifts forward by 1: C→D, A→B, T→U. So D→E, O→P, G→H, giving EPH.',
  },
  {
    slug: 'x-lr-series-letter',
    title: 'Letter Series',
    difficulty: 'easy',
    topics: ['Series'],
    domain: 'logical-reasoning',
    description: 'Find the next term: A, C, F, J, ?',
    options: ['M', 'N', 'O', 'P'],
    correctOption: 2,
    explanation:
      'The gaps increase by one each step: +2 (A→C), +3 (C→F), +4 (F→J), +5 (J→O). So the next term is O.',
  },
  {
    slug: 'x-lr-direction',
    title: 'Direction Sense',
    difficulty: 'medium',
    topics: ['Direction Sense'],
    domain: 'logical-reasoning',
    description:
      'A man walks 5 km North, turns right and walks 5 km, then turns right and walks 5 km. In which direction is he from the start?',
    options: ['North', 'South', 'East', 'West'],
    correctOption: 2,
    explanation:
      'North 5, then East 5 (first right), then South 5 (second right) returns him to the start latitude but 5 km East. So he is East of the start.',
  },
  {
    slug: 'x-lr-odd-one',
    title: 'Odd One Out',
    difficulty: 'easy',
    topics: ['Classification'],
    domain: 'logical-reasoning',
    description: 'Which one does not belong with the others?',
    options: ['Triangle', 'Square', 'Circle', 'Rectangle'],
    correctOption: 2,
    explanation:
      'A circle has no straight sides or vertices; the triangle, square and rectangle are all polygons with straight sides.',
  },
  {
    slug: 'x-lr-analogy',
    title: 'Analogy',
    difficulty: 'easy',
    topics: ['Analogy'],
    domain: 'logical-reasoning',
    description: 'Hand is to Glove as Foot is to ___?',
    options: ['Shoe', 'Toe', 'Leg', 'Sock'],
    correctOption: 0,
    explanation:
      'A glove covers the hand; the item that covers the foot in the same way is a shoe.',
  },
  {
    slug: 'x-lr-statement-conclusion',
    title: 'Statement & Conclusion',
    difficulty: 'hard',
    topics: ['Logical Deduction'],
    domain: 'logical-reasoning',
    description:
      'Statement: "All successful people work hard." Which conclusion is logically valid?',
    options: [
      'All hard workers are successful.',
      'A person who does not work hard is not successful.',
      'Hard work is unnecessary for success.',
      'Some successful people are lazy.',
    ],
    correctOption: 1,
    explanation:
      'If all successful people work hard, then anyone who does NOT work hard cannot be successful (the contrapositive). "All hard workers are successful" does not follow.',
  },
  {
    slug: 'x-lr-number-series',
    title: 'Number Series',
    difficulty: 'medium',
    topics: ['Series'],
    domain: 'logical-reasoning',
    description: 'Find the next number: 3, 6, 11, 18, 27, ?',
    options: ['36', '38', '40', '42'],
    correctOption: 1,
    explanation:
      'Differences are 3, 5, 7, 9 (odd numbers increasing by 2). The next difference is 11, so 27 + 11 = 38.',
  },
  {
    slug: 'x-lr-calendar',
    title: 'Day of the Week',
    difficulty: 'medium',
    topics: ['Calendar'],
    domain: 'logical-reasoning',
    description: 'If today is Wednesday, what day will it be after 100 days?',
    options: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
    correctOption: 1,
    explanation:
      '100 ÷ 7 leaves a remainder of 2 (since 98 is divisible by 7). Two days after Wednesday is Friday.',
  },

  // ---------------- Data Interpretation (new) ----------------
  {
    slug: 'x-di-growth',
    title: 'Percentage Growth',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      "A company's sales (₹ lakh) were 2021: 60, 2022: 75. What is the percentage growth from 2021 to 2022?",
    options: ['15%', '20%', '25%', '30%'],
    correctOption: 2,
    explanation: 'Growth = (75 − 60) / 60 × 100 = 15/60 × 100 = 25%.',
  },
  {
    slug: 'x-di-average',
    title: 'Average from Data',
    difficulty: 'easy',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Monthly rainfall (mm) for 4 months: 120, 80, 100, 140. What is the average monthly rainfall?',
    options: ['100', '110', '120', '130'],
    correctOption: 1,
    explanation: 'Average = (120 + 80 + 100 + 140) / 4 = 440 / 4 = 110 mm.',
  },
  {
    slug: 'x-di-ratio',
    title: 'Ratio from a Table',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'A class has 30 boys and 20 girls. What is the ratio of girls to the total number of students?',
    options: ['2 : 5', '2 : 3', '3 : 5', '1 : 2'],
    correctOption: 0,
    explanation: 'Total = 50. Girls : total = 20 : 50 = 2 : 5.',
  },
  {
    slug: 'x-di-pie',
    title: 'Pie Chart Reading',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'In a household budget pie chart, Food takes 90° of the circle. What percentage of the budget is spent on Food?',
    options: ['18%', '25%', '30%', '45%'],
    correctOption: 1,
    explanation: 'The full circle is 360°. Food = 90 / 360 × 100 = 25% of the budget.',
  },
  {
    slug: 'x-di-difference',
    title: 'Comparing Categories',
    difficulty: 'easy',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Units sold — Product A: 1,200, Product B: 900. Product A sold what percent more than Product B?',
    options: ['25%', '33.3%', '30%', '40%'],
    correctOption: 1,
    explanation: 'Difference = 300. Percent more than B = 300 / 900 × 100 ≈ 33.3%.',
  },
  {
    slug: 'x-di-bar',
    title: 'Bar Graph Total',
    difficulty: 'easy',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Quarterly profit (₹ crore): Q1: 12, Q2: 15, Q3: 9, Q4: 14. What is the total annual profit?',
    options: ['₹45 cr', '₹48 cr', '₹50 cr', '₹52 cr'],
    correctOption: 2,
    explanation: 'Total = 12 + 15 + 9 + 14 = ₹50 crore.',
  },
  {
    slug: 'x-di-share',
    title: 'Market Share',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      "In a market of 4,000 units, Brand X holds 1,000 units. What is Brand X's market share?",
    options: ['20%', '25%', '30%', '40%'],
    correctOption: 1,
    explanation: 'Share = 1,000 / 4,000 × 100 = 25%.',
  },
  {
    slug: 'x-di-twoyear',
    title: 'Two-Year Comparison',
    difficulty: 'hard',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'Revenue (₹ lakh): 2022 — Product P: 50, Product Q: 30. 2023 — P: 60, Q: 45. Which product grew faster (by %)?',
    options: ['Product P (20%)', 'Product Q (50%)', 'Both grew equally', 'Cannot be determined'],
    correctOption: 1,
    explanation: 'P grew (60−50)/50 = 20%. Q grew (45−30)/30 = 50%. Product Q grew faster.',
  },
  {
    slug: 'x-di-fraction',
    title: 'Fraction of Total',
    difficulty: 'easy',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description: 'Of 800 survey respondents, 200 chose "Very satisfied". What fraction is this?',
    options: ['1/2', '1/3', '1/4', '1/5'],
    correctOption: 2,
    explanation: '200 / 800 = 1/4 of respondents.',
  },
  {
    slug: 'x-di-rate',
    title: 'Per-Unit Value',
    difficulty: 'medium',
    topics: ['Data Interpretation'],
    domain: 'data-interpretation',
    description:
      'A factory produced 5,000 units at a total cost of ₹2,50,000. What is the cost per unit?',
    options: ['₹40', '₹50', '₹60', '₹25'],
    correctOption: 1,
    explanation: 'Cost per unit = 2,50,000 / 5,000 = ₹50.',
  },

  // ---------------- Banking & Finance (new) ----------------
  {
    slug: 'x-bank-repo',
    title: 'Repo Rate',
    difficulty: 'medium',
    topics: ['Monetary Policy'],
    domain: 'banking',
    description: 'What is the "repo rate"?',
    options: [
      'The rate at which banks lend to the public.',
      'The rate at which the RBI lends short-term funds to commercial banks.',
      'The rate of interest on savings accounts.',
      'The tax rate on banking transactions.',
    ],
    correctOption: 1,
    explanation:
      'The repo rate is the rate at which the RBI lends to commercial banks against securities. Raising it makes borrowing costlier and helps curb inflation.',
  },
  {
    slug: 'x-bank-crr',
    title: 'CRR',
    difficulty: 'medium',
    topics: ['Banking Regulation'],
    domain: 'banking',
    description: 'The Cash Reserve Ratio (CRR) is:',
    options: [
      'The portion of deposits banks must keep as reserves with the RBI.',
      'The interest banks pay on fixed deposits.',
      'The minimum balance a customer must keep.',
      'The ratio of loans to deposits.',
    ],
    correctOption: 0,
    explanation:
      "CRR is the percentage of a bank's total deposits it must hold as reserves with the RBI. A higher CRR reduces the funds banks can lend.",
  },
  {
    slug: 'x-bank-neft-rtgs',
    title: 'NEFT vs RTGS',
    difficulty: 'easy',
    topics: ['Payment Systems'],
    domain: 'banking',
    description:
      'Which payment system is used for large-value, real-time gross settlement transfers?',
    options: ['NEFT', 'RTGS', 'UPI', 'Cheque'],
    correctOption: 1,
    explanation:
      'RTGS (Real-Time Gross Settlement) settles high-value transfers individually and in real time (minimum ₹2 lakh). NEFT settles in batches.',
  },
  {
    slug: 'x-bank-npa',
    title: 'NPA',
    difficulty: 'medium',
    topics: ['Banking'],
    domain: 'banking',
    description: 'In banking, what is a Non-Performing Asset (NPA)?',
    options: [
      'A loan on which interest/principal is overdue for 90+ days.',
      'A profitable investment.',
      'A savings account with no transactions.',
      'A government bond.',
    ],
    correctOption: 0,
    explanation:
      'An NPA is a loan or advance for which the principal or interest payment remains overdue for 90 days or more — it stops generating income for the bank.',
  },
  {
    slug: 'x-bank-kyc',
    title: 'KYC',
    difficulty: 'easy',
    topics: ['Banking Compliance'],
    domain: 'banking',
    description: 'What does KYC stand for in banking?',
    options: [
      'Keep Your Cash',
      'Know Your Customer',
      'Key Yield Computation',
      'Knowledge of Your Credit',
    ],
    correctOption: 1,
    explanation:
      "KYC = Know Your Customer — the process of verifying a customer's identity and address to prevent fraud and money laundering.",
  },
  {
    slug: 'x-bank-rbi-role',
    title: 'Role of the RBI',
    difficulty: 'easy',
    topics: ['Central Banking'],
    domain: 'banking',
    description: 'Which of these is NOT a function of the Reserve Bank of India?',
    options: [
      'Issuing currency notes',
      'Acting as banker to the government',
      'Setting income tax rates',
      'Regulating commercial banks',
    ],
    correctOption: 2,
    explanation:
      "Income tax rates are set by the government (via the Finance Act / Budget), not the RBI. The RBI issues currency, regulates banks and is the government's banker.",
  },
  {
    slug: 'x-bank-inflation',
    title: 'Inflation',
    difficulty: 'easy',
    topics: ['Economy'],
    domain: 'banking',
    description: 'Inflation refers to:',
    options: [
      'A general rise in the price level over time.',
      'An increase in the value of money.',
      'A fall in interest rates.',
      'Growth in exports.',
    ],
    correctOption: 0,
    explanation:
      'Inflation is a sustained general rise in prices, which reduces the purchasing power of money. The RBI targets it via monetary policy.',
  },
  {
    slug: 'x-bank-regulators',
    title: 'Financial Regulators',
    difficulty: 'medium',
    topics: ['Regulators'],
    domain: 'banking',
    description: 'Which body regulates the insurance sector in India?',
    options: ['SEBI', 'RBI', 'IRDAI', 'PFRDA'],
    correctOption: 2,
    explanation:
      'IRDAI (Insurance Regulatory and Development Authority of India) regulates insurance. SEBI handles securities, RBI banking, and PFRDA pensions.',
  },
  {
    slug: 'x-bank-upi',
    title: 'UPI',
    difficulty: 'easy',
    topics: ['Digital Payments'],
    domain: 'banking',
    description: 'UPI (Unified Payments Interface) is operated by:',
    options: [
      'The Reserve Bank of India directly',
      'NPCI (National Payments Corporation of India)',
      'SEBI',
      'The Ministry of Finance',
    ],
    correctOption: 1,
    explanation:
      "UPI is built and operated by NPCI, an umbrella organisation for retail payments set up by the RBI and the Indian Banks' Association.",
  },
  {
    slug: 'x-bank-fd',
    title: 'Fixed Deposit',
    difficulty: 'easy',
    topics: ['Banking Products'],
    domain: 'banking',
    description: 'Compared with a savings account, a Fixed Deposit (FD) generally offers:',
    options: [
      'A higher interest rate in exchange for locking the money for a fixed term.',
      'Unlimited withdrawals with no penalty.',
      'No interest at all.',
      'Lower interest but more liquidity.',
    ],
    correctOption: 0,
    explanation:
      'An FD pays a higher, fixed rate because the money is locked for a set term; early withdrawal usually incurs a penalty. A savings account is more liquid but pays less.',
  },

  // ---------------- Padding: Law ----------------
  {
    slug: 'x-law-void-voidable',
    title: 'Void vs Voidable',
    difficulty: 'medium',
    topics: ['Contract Law'],
    domain: 'law',
    description: 'A contract entered into under coercion is best described as:',
    options: [
      'Void from the start',
      'Voidable at the option of the aggrieved party',
      'Illegal',
      'Unenforceable by both parties',
    ],
    correctOption: 1,
    explanation:
      'Consent obtained by coercion makes a contract voidable at the option of the party whose consent was so caused (s.19, Indian Contract Act) — they may affirm or rescind it.',
  },
  {
    slug: 'x-law-fundamental-duty',
    title: 'Fundamental Duties',
    difficulty: 'easy',
    topics: ['Constitutional Law'],
    domain: 'law',
    description: 'Fundamental Duties were added to the Indian Constitution by which amendment?',
    options: ['42nd Amendment', '44th Amendment', '1st Amendment', '73rd Amendment'],
    correctOption: 0,
    explanation:
      'The 42nd Amendment (1976) inserted Part IV-A (Article 51A) listing the Fundamental Duties of citizens.',
  },
  {
    slug: 'x-law-bail',
    title: 'Bailable Offence',
    difficulty: 'medium',
    topics: ['Criminal Law'],
    domain: 'law',
    description: 'In a bailable offence, bail is:',
    options: [
      'A matter of right for the accused',
      "Granted only at the court's discretion",
      'Never available',
      'Available only after trial',
    ],
    correctOption: 0,
    explanation:
      "For a bailable offence, bail is a right — the accused can be released on furnishing bail. For non-bailable offences, it is at the court's discretion.",
  },
  {
    slug: 'x-law-trademark',
    title: 'Trademark',
    difficulty: 'easy',
    topics: ['Intellectual Property Law'],
    domain: 'law',
    description: 'A trademark primarily protects:',
    options: [
      'An invention',
      'A brand name, logo or symbol that identifies goods/services',
      'An original literary work',
      'A trade secret',
    ],
    correctOption: 1,
    explanation:
      "A trademark protects marks (names, logos, symbols) that distinguish one trader's goods or services from another's. Inventions are patents; literary works are copyright.",
  },
  {
    slug: 'x-law-natural-justice',
    title: 'Natural Justice',
    difficulty: 'medium',
    topics: ['Administrative Law'],
    domain: 'law',
    description: 'The principle "audi alteram partem" means:',
    options: [
      'No one should be a judge in their own cause',
      'Hear the other side before deciding',
      'Justice delayed is justice denied',
      'Ignorance of law is no excuse',
    ],
    correctOption: 1,
    explanation:
      '"Audi alteram partem" — hear the other side — is a rule of natural justice requiring that a person be given a fair opportunity to be heard before a decision against them.',
  },

  // ---------------- Padding: Commerce ----------------
  {
    slug: 'x-com-accounting-eq',
    title: 'Accounting Equation',
    difficulty: 'easy',
    topics: ['Financial Accounting'],
    domain: 'commerce',
    description: 'The fundamental accounting equation is:',
    options: [
      'Assets = Liabilities + Capital',
      'Assets = Liabilities − Capital',
      'Capital = Assets + Liabilities',
      'Income = Assets − Expenses',
    ],
    correctOption: 0,
    explanation:
      "Assets = Liabilities + Capital (owner's equity). Every transaction keeps this balance, which is the basis of double-entry bookkeeping.",
  },
  {
    slug: 'x-com-working-capital',
    title: 'Working Capital',
    difficulty: 'medium',
    topics: ['Financial Management'],
    domain: 'commerce',
    description: 'Working capital is calculated as:',
    options: [
      'Current assets − current liabilities',
      'Total assets − total liabilities',
      'Fixed assets + current assets',
      'Revenue − expenses',
    ],
    correctOption: 0,
    explanation:
      'Working capital = current assets − current liabilities. It measures the short-term liquidity available to run day-to-day operations.',
  },
  {
    slug: 'x-com-gst-type',
    title: 'GST Structure',
    difficulty: 'medium',
    topics: ['Taxation'],
    domain: 'commerce',
    description: 'On an intra-state sale under GST, which taxes are levied?',
    options: ['IGST only', 'CGST + SGST', 'CGST only', 'SGST + IGST'],
    correctOption: 1,
    explanation:
      'Intra-state supplies attract CGST (central) + SGST (state) in equal halves. Inter-state supplies attract IGST instead.',
  },
  {
    slug: 'x-com-bep',
    title: 'Fixed vs Variable',
    difficulty: 'easy',
    topics: ['Cost Accounting'],
    domain: 'commerce',
    description: 'Which of the following is a fixed cost?',
    options: ['Raw materials', 'Factory rent', 'Sales commission', 'Packaging per unit'],
    correctOption: 1,
    explanation:
      'Factory rent stays the same regardless of output, so it is a fixed cost. The others vary with the number of units produced/sold.',
  },
  {
    slug: 'x-com-dividend',
    title: 'Dividend',
    difficulty: 'easy',
    topics: ['Corporate Finance'],
    domain: 'commerce',
    description: 'A dividend is:',
    options: [
      'A portion of profit distributed to shareholders',
      'Interest paid on a loan',
      'A tax on company profits',
      'The price of a share',
    ],
    correctOption: 0,
    explanation:
      "A dividend is the share of a company's profit paid out to its shareholders, usually declared per share.",
  },

  // ---------------- Padding: Management ----------------
  {
    slug: 'x-mgmt-pdca',
    title: 'PDCA Cycle',
    difficulty: 'medium',
    topics: ['Operations'],
    domain: 'management',
    description: 'The PDCA cycle for continuous improvement stands for:',
    options: [
      'Plan-Do-Check-Act',
      'Predict-Decide-Control-Adjust',
      'Plan-Design-Create-Assess',
      'Prepare-Develop-Check-Apply',
    ],
    correctOption: 0,
    explanation:
      'PDCA = Plan, Do, Check, Act — the Deming cycle for iterative continuous improvement of processes.',
  },
  {
    slug: 'x-mgmt-span',
    title: 'Span of Control',
    difficulty: 'medium',
    topics: ['Organizational Structure'],
    domain: 'management',
    description: '"Span of control" refers to:',
    options: [
      'The number of subordinates a manager directly supervises',
      'The geographic area a company covers',
      'The length of a project',
      'The range of products a firm sells',
    ],
    correctOption: 0,
    explanation:
      'Span of control is the number of employees who report directly to one manager. A wide span = flatter structure; a narrow span = taller hierarchy.',
  },
  {
    slug: 'x-mgmt-4c',
    title: 'Marketing 4 Cs',
    difficulty: 'easy',
    topics: ['Marketing'],
    domain: 'management',
    description: 'In the customer-centric "4 Cs" model, which replaces "Price" from the 4 Ps?',
    options: ['Convenience', 'Cost to the customer', 'Communication', 'Customer'],
    correctOption: 1,
    explanation:
      'The 4 Cs map to the 4 Ps: Customer solution (Product), Cost to the customer (Price), Convenience (Place), Communication (Promotion).',
  },
  {
    slug: 'x-mgmt-motivation',
    title: 'Theory X and Y',
    difficulty: 'medium',
    topics: ['Organizational Behavior'],
    domain: 'management',
    description: "McGregor's Theory Y assumes that employees:",
    options: [
      'Dislike work and must be controlled',
      'Are self-motivated and seek responsibility',
      'Only respond to financial rewards',
      'Cannot make good decisions',
    ],
    correctOption: 1,
    explanation:
      'Theory Y assumes people are self-motivated, enjoy work and seek responsibility (participative management). Theory X assumes the opposite (workers need control).',
  },
  {
    slug: 'x-mgmt-bcg',
    title: 'BCG Matrix',
    difficulty: 'medium',
    topics: ['Strategy'],
    domain: 'management',
    description: 'In the BCG matrix, a product with high market share in a low-growth market is a:',
    options: ['Star', 'Cash Cow', 'Question Mark', 'Dog'],
    correctOption: 1,
    explanation:
      'High share + low growth = Cash Cow (generates steady cash). Stars are high share/high growth; Question Marks low share/high growth; Dogs low share/low growth.',
  },

  // ---------------- Padding: Aptitude ----------------
  {
    slug: 'x-apt-ci',
    title: 'Compound Interest',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'Find the compound interest on ₹10,000 at 10% per annum for 2 years (compounded annually).',
    options: ['₹2,000', '₹2,100', '₹2,200', '₹1,000'],
    correctOption: 1,
    explanation:
      'Amount = 10,000 × (1.1)² = 10,000 × 1.21 = ₹12,100. CI = 12,100 − 10,000 = ₹2,100.',
  },
  {
    slug: 'x-apt-percentage-2',
    title: 'Successive Percentage',
    difficulty: 'hard',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'A price is increased by 20% and then decreased by 20%. The net change is:',
    options: ['No change', '4% decrease', '4% increase', '2% decrease'],
    correctOption: 1,
    explanation:
      'Net factor = 1.2 × 0.8 = 0.96, i.e. 96% of the original — a 4% net decrease. Successive equal +x% then −x% always gives a net decrease.',
  },
  {
    slug: 'x-apt-lcm',
    title: 'LCM',
    difficulty: 'easy',
    topics: ['Number System'],
    domain: 'aptitude',
    description: 'What is the LCM of 4, 6 and 8?',
    options: ['12', '24', '48', '16'],
    correctOption: 1,
    explanation: 'LCM of 4 (2²), 6 (2·3), 8 (2³) takes the highest powers: 2³ × 3 = 24.',
  },
  {
    slug: 'x-apt-prob',
    title: 'Basic Probability',
    difficulty: 'medium',
    topics: ['Probability'],
    domain: 'aptitude',
    description: 'A fair die is rolled once. What is the probability of getting an even number?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctOption: 2,
    explanation:
      'Even outcomes are 2, 4, 6 — that is 3 of 6 equally likely outcomes, so probability = 3/6 = 1/2.',
  },
  {
    slug: 'x-apt-partnership',
    title: 'Mixtures',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'In 40 litres of a mixture, milk and water are in the ratio 3 : 1. How much milk is there?',
    options: ['10 L', '20 L', '30 L', '32 L'],
    correctOption: 2,
    explanation: 'Total parts = 3 + 1 = 4. Milk = 3/4 × 40 = 30 litres.',
  },

  // ---------------- Padding: English ----------------
  {
    slug: 'x-eng-active-passive',
    title: 'Active / Passive Voice',
    difficulty: 'medium',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Choose the correct passive form of: "The chef cooked a meal."',
    options: [
      'A meal was cooked by the chef.',
      'A meal is cooked by the chef.',
      'A meal cooked by the chef.',
      'The chef was cooked a meal.',
    ],
    correctOption: 0,
    explanation:
      'Past simple active "cooked" becomes "was/were + past participle" in the passive: "A meal was cooked by the chef."',
  },
  {
    slug: 'x-eng-synonym-2',
    title: 'Synonym',
    difficulty: 'easy',
    topics: ['Vocabulary'],
    domain: 'english',
    description: "Choose the word closest in meaning to 'CANDID':",
    options: ['Secretive', 'Frank', 'Rude', 'Careless'],
    correctOption: 1,
    explanation: "'Candid' means open and honest, i.e. frank.",
  },
  {
    slug: 'x-eng-article',
    title: 'Articles',
    difficulty: 'easy',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Fill in the blank: "She is ___ honest person."',
    options: ['a', 'an', 'the', 'no article'],
    correctOption: 1,
    explanation:
      "Use 'an' before a vowel sound. 'Honest' begins with a silent 'h', so it sounds like a vowel — 'an honest person.'",
  },
  {
    slug: 'x-eng-onewordsub-2',
    title: 'One-Word Substitution',
    difficulty: 'medium',
    topics: ['Vocabulary'],
    domain: 'english',
    description: 'A government by the wealthy is called:',
    options: ['Aristocracy', 'Plutocracy', 'Democracy', 'Autocracy'],
    correctOption: 1,
    explanation:
      'Plutocracy = rule by the wealthy. Aristocracy is rule by a privileged class, democracy by the people, autocracy by one person.',
  },
  {
    slug: 'x-eng-idiom-2',
    title: 'Idiom Meaning',
    difficulty: 'medium',
    topics: ['Verbal Ability'],
    domain: 'english',
    description: "What does 'once in a blue moon' mean?",
    options: ['Very frequently', 'Very rarely', 'At night', 'Suddenly'],
    correctOption: 1,
    explanation: "'Once in a blue moon' means something that happens very rarely.",
  },

  // ---------------- Padding: General Knowledge ----------------
  {
    slug: 'x-gk-parliament',
    title: 'Indian Parliament',
    difficulty: 'easy',
    topics: ['Indian Polity'],
    domain: 'general-knowledge',
    description: 'The two houses of the Indian Parliament are:',
    options: [
      'Lok Sabha and Rajya Sabha',
      'Lok Sabha and Vidhan Sabha',
      'Rajya Sabha and Vidhan Parishad',
      'Lok Sabha and Senate',
    ],
    correctOption: 0,
    explanation:
      'Parliament has the Lok Sabha (House of the People, lower house) and the Rajya Sabha (Council of States, upper house).',
  },
  {
    slug: 'x-gk-currency',
    title: 'World Currencies',
    difficulty: 'easy',
    topics: ['Geography'],
    domain: 'general-knowledge',
    description: 'What is the currency of Japan?',
    options: ['Won', 'Yuan', 'Yen', 'Ringgit'],
    correctOption: 2,
    explanation:
      'The Yen is the currency of Japan. The Won is South Korean, the Yuan Chinese, the Ringgit Malaysian.',
  },
  {
    slug: 'x-gk-planet',
    title: 'Solar System',
    difficulty: 'easy',
    topics: ['Science'],
    domain: 'general-knowledge',
    description: 'Which is the largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
    correctOption: 1,
    explanation: 'Jupiter is the largest planet, with a diameter about 11 times that of Earth.',
  },
  {
    slug: 'x-gk-freedom',
    title: 'Indian History',
    difficulty: 'medium',
    topics: ['History'],
    domain: 'general-knowledge',
    description: 'In which year did India gain independence?',
    options: ['1945', '1947', '1950', '1942'],
    correctOption: 1,
    explanation:
      'India became independent on 15 August 1947. The Constitution came into force later, on 26 January 1950.',
  },
  {
    slug: 'x-gk-organ',
    title: 'Human Body',
    difficulty: 'easy',
    topics: ['Science'],
    domain: 'general-knowledge',
    description: 'Which organ pumps blood throughout the human body?',
    options: ['Liver', 'Lungs', 'Heart', 'Kidney'],
    correctOption: 2,
    explanation:
      'The heart pumps blood through the circulatory system, delivering oxygen and nutrients to the body.',
  },
];

async function main() {
  const p = new PrismaClient();

  const domainId: Record<string, string> = {};
  // New domains (upsert) + look up existing ones referenced by padding questions.
  for (const d of DOMAINS) {
    const row = await p.practiceDomain.upsert({
      where: { slug: d.slug },
      update: { name: d.name, icon: d.icon, sortOrder: d.sortOrder },
      create: { slug: d.slug, name: d.name, icon: d.icon, sortOrder: d.sortOrder },
    });
    domainId[d.slug] = row.id;
  }
  for (const slug of [
    'law',
    'commerce',
    'management',
    'aptitude',
    'english',
    'general-knowledge',
  ]) {
    const row = await p.practiceDomain.findUnique({ where: { slug } });
    if (row) domainId[slug] = row.id;
  }

  let n = 0;
  for (const q of Q) {
    const did = domainId[q.domain];
    if (!did) {
      console.warn(`No domain for "${q.domain}" (${q.slug}) — skipping.`);
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

  console.log(`Done. ${DOMAINS.length} new tracks ensured; ${n} MCQs upserted.`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
