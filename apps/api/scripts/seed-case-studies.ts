/* eslint-disable no-console */
// Seeds Law + Commerce practice tracks as case-study MCQs (kind="mcq"). Creates
// the practice domains and idempotently upserts the questions. Re-runnable.
import { PrismaClient } from '@prisma/client';

const DOMAINS = [
  { slug: 'law', name: 'Law', icon: 'Scale', sortOrder: 19 },
  { slug: 'commerce', name: 'Commerce & Finance', icon: 'Landmark', sortOrder: 20 },
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

const QUESTIONS: Mcq[] = [
  // ---------------- Law ----------------
  {
    slug: 'cs-law-invitation-to-treat',
    title: 'Offer vs Invitation to Treat',
    difficulty: 'easy',
    topics: ['Contract Law'],
    domain: 'law',
    description:
      'A shop displays a watch in its window with a price tag of ₹2,000. A customer walks in and says, "I accept your offer to sell at ₹2,000." The shopkeeper refuses to sell. Under the Indian Contract Act, what is the correct legal position?',
    options: [
      'A binding contract was formed; the shopkeeper must sell at ₹2,000.',
      'The display is an invitation to treat, not an offer; no contract exists.',
      'The customer made an invitation to treat by entering the shop.',
      'The price tag is a counter-offer the customer accepted.',
    ],
    correctOption: 1,
    explanation:
      'A display of goods with a price is an invitation to treat, an invitation for customers to make an offer, not an offer itself. The customer makes the offer by proposing to buy; the shopkeeper may accept or reject it (Pharmaceutical Society v Boots).',
  },
  {
    slug: 'cs-law-consideration',
    title: 'Promise Without Consideration',
    difficulty: 'easy',
    topics: ['Contract Law'],
    domain: 'law',
    description:
      'A promises to gift B ₹50,000 next month out of love and affection. Nothing is given in return and the promise is not in writing or registered. B sues when A backs out. Is the promise enforceable under the Indian Contract Act?',
    options: [
      'Yes, all promises are enforceable.',
      'No, it generally lacks consideration and no exception under s.25 applies.',
      'Yes, love and affection is always valid consideration.',
      'No, because gifts are illegal.',
    ],
    correctOption: 1,
    explanation:
      'An agreement without consideration is void (s.25). The "natural love and affection" exception requires the promise to be in writing AND registered AND between parties in a near relation, not satisfied here, so it is unenforceable.',
  },
  {
    slug: 'cs-law-article-21',
    title: 'Scope of Article 21',
    difficulty: 'medium',
    topics: ['Constitutional Law'],
    domain: 'law',
    description:
      'A state law allows detention without informing the person of the grounds or allowing legal representation. A challenges it under the Constitution. Which right is most directly engaged, as expanded by Maneka Gandhi v Union of India?',
    options: [
      'Right to property under Article 300A only.',
      'Right to life and personal liberty under Article 21, which requires a just, fair and reasonable procedure.',
      'Freedom of trade under Article 19(1)(g).',
      'Right to equality under Article 14 only.',
    ],
    correctOption: 1,
    explanation:
      'Article 21 protects life and personal liberty. Post Maneka Gandhi, any "procedure established by law" depriving liberty must be just, fair and reasonable, not arbitrary, so a procedure denying grounds and representation fails.',
  },
  {
    slug: 'cs-law-copyright-vs-patent',
    title: 'Copyright vs Patent',
    difficulty: 'easy',
    topics: ['Intellectual Property Law'],
    domain: 'law',
    description:
      'A developer writes original source code for an app and also invents a novel hardware mechanism inside the device. Which IP rights best fit each?',
    options: [
      'Patent for the code, copyright for the hardware mechanism.',
      'Copyright for the original code, patent for the novel hardware invention.',
      'Trademark for both.',
      'Neither is protectable.',
    ],
    correctOption: 1,
    explanation:
      'Source code is an original literary work protected by copyright (automatic, on creation). A novel, non-obvious, useful invention like a hardware mechanism is protected by a patent (granted on application and examination).',
  },
  {
    slug: 'cs-law-mens-rea',
    title: 'Mens Rea in Criminal Liability',
    difficulty: 'medium',
    topics: ['Criminal Law'],
    domain: 'law',
    description:
      "A takes B's umbrella from a stand, genuinely and reasonably believing it is her own. B alleges theft. What is the most accurate analysis?",
    options: [
      'Theft is made out because A took the umbrella.',
      'No theft, theft requires a dishonest intention (mens rea), which is absent on an honest mistaken belief of ownership.',
      'Theft is strict liability and intention is irrelevant.',
      'It is robbery, not theft.',
    ],
    correctOption: 1,
    explanation:
      "Theft requires dishonest intention to take property out of another's possession without consent. A genuine, reasonable belief that the item is one's own negates the dishonest intention (mens rea), so no theft is committed.",
  },
  {
    slug: 'cs-law-separate-legal-entity',
    title: 'The Corporate Veil',
    difficulty: 'medium',
    topics: ['Corporate & Company Law'],
    domain: 'law',
    description:
      'S incorporates a company and is its majority shareholder and a secured creditor. The company becomes insolvent. Unsecured creditors argue S and the company are "the same person" so S should pay personally. What is the leading position?',
    options: [
      'S is personally liable because he controls the company.',
      'A company is a separate legal person distinct from its members; S is not personally liable merely for control (Salomon v Salomon).',
      'Shareholders are always personally liable for company debts.',
      'Secured creditors rank below unsecured creditors.',
    ],
    correctOption: 1,
    explanation:
      'Salomon v Salomon established that a duly incorporated company is a separate legal entity. Members are not personally liable for its debts merely because they own or control it, absent fraud or grounds to lift the veil.',
  },
  {
    slug: 'cs-law-negligence-duty',
    title: 'Negligence: Duty of Care',
    difficulty: 'medium',
    topics: ['Civil Litigation'],
    domain: 'law',
    description:
      'A manufacturer sells a sealed drink containing a contaminant. The end consumer, who did not buy it directly, falls ill. There is no contract between the consumer and the manufacturer. Can the consumer recover in tort?',
    options: [
      'No, because there is no contract (privity) with the manufacturer.',
      'Yes, a manufacturer owes a duty of care to the ultimate consumer (Donoghue v Stevenson).',
      'No, only the retailer can ever be liable.',
      'Yes, but only for a refund of the price.',
    ],
    correctOption: 1,
    explanation:
      'Donoghue v Stevenson established the "neighbour principle": a manufacturer owes a duty of care to the ultimate consumer who could foreseeably be harmed, independent of any contract. Liability in negligence does not require privity of contract.',
  },
  {
    slug: 'cs-law-consumer-definition',
    title: 'Who is a "Consumer"?',
    difficulty: 'easy',
    topics: ['Compliance & Regulatory'],
    domain: 'law',
    description:
      'X buys 50 industrial sewing machines to run a large commercial garment factory for profit (not self-employment). A machine is defective. Can X complain as a "consumer" under the Consumer Protection Act?',
    options: [
      'Yes, every buyer is a consumer.',
      'No, goods bought for a commercial/resale purpose are excluded, unless bought for self-employment to earn a livelihood.',
      'Yes, because the machines are defective.',
      'No, only services are covered by the Act.',
    ],
    correctOption: 1,
    explanation:
      'The Consumer Protection Act excludes a person who buys goods for "commercial purpose". A narrow exception covers goods bought to earn a living by self-employment. A large for-profit factory does not fit the exception, so X is not a "consumer".',
  },

  // ---------------- Commerce & Finance ----------------
  {
    slug: 'cs-com-debit-credit',
    title: 'Recording a Transaction',
    difficulty: 'easy',
    topics: ['Financial Accounting'],
    domain: 'commerce',
    description:
      'A business buys office furniture for ₹40,000 and pays by cheque. Using double-entry accounting, what is the correct journal entry?',
    options: [
      'Debit Bank ₹40,000; Credit Furniture ₹40,000.',
      'Debit Furniture ₹40,000; Credit Bank ₹40,000.',
      'Debit Furniture ₹40,000; Credit Capital ₹40,000.',
      'Debit Purchases ₹40,000; Credit Cash ₹40,000.',
    ],
    correctOption: 1,
    explanation:
      'Furniture (an asset) increases, so it is debited. Bank (an asset) decreases as the cheque is paid, so it is credited. "Debit what comes in, credit what goes out."',
  },
  {
    slug: 'cs-com-depreciation',
    title: 'Choosing a Depreciation Method',
    difficulty: 'medium',
    topics: ['Financial Accounting'],
    domain: 'commerce',
    description:
      'A machine costs ₹1,00,000 with no salvage value and a 5-year life. Under the straight-line method, what is the annual depreciation, and how does it compare to the written-down-value (WDV) method in year 1?',
    options: [
      '₹20,000/year; WDV charges less in year 1.',
      '₹20,000/year; WDV typically charges more in year 1.',
      '₹25,000/year; both methods are identical.',
      '₹10,000/year; WDV is not allowed.',
    ],
    correctOption: 1,
    explanation:
      'Straight-line = (cost − salvage) / life = 1,00,000 / 5 = ₹20,000 per year (constant). WDV applies a fixed % to a declining book value, so it front-loads depreciation, charging more in the early years (year 1) than straight-line.',
  },
  {
    slug: 'cs-com-input-tax-credit',
    title: 'GST Input Tax Credit',
    difficulty: 'medium',
    topics: ['GST & Indirect Taxation'],
    domain: 'commerce',
    description:
      'A registered trader buys goods for ₹1,00,000 + ₹18,000 GST (input) and sells them for ₹1,50,000 + ₹27,000 GST (output). Assuming the input is eligible, how much GST must the trader actually pay to the government?',
    options: [
      '₹27,000 (the full output tax).',
      '₹9,000 (output ₹27,000 minus input credit ₹18,000).',
      '₹18,000 (the input tax).',
      '₹45,000 (input plus output).',
    ],
    correctOption: 1,
    explanation:
      'GST works on value addition via input tax credit. Net GST payable = output tax − eligible input tax credit = ₹27,000 − ₹18,000 = ₹9,000.',
  },
  {
    slug: 'cs-com-current-ratio',
    title: 'Reading the Current Ratio',
    difficulty: 'easy',
    topics: ['Financial Analysis'],
    domain: 'commerce',
    description:
      'A firm has current assets of ₹6,00,000 and current liabilities of ₹3,00,000. What is its current ratio, and what does it indicate?',
    options: [
      '0.5 : 1, poor liquidity.',
      '2 : 1, generally healthy short-term liquidity.',
      '3 : 1, the firm is insolvent.',
      'It cannot be computed without net profit.',
    ],
    correctOption: 1,
    explanation:
      'Current ratio = current assets / current liabilities = 6,00,000 / 3,00,000 = 2 : 1. A ratio around 2:1 is conventionally considered comfortable short-term liquidity, enough current assets to cover current liabilities.',
  },
  {
    slug: 'cs-com-fixed-variable',
    title: 'Fixed vs Variable Cost',
    difficulty: 'easy',
    topics: ['Cost & Management Accounting'],
    domain: 'commerce',
    description:
      'Factory rent is ₹50,000/month regardless of output, and raw material is ₹20 per unit. If output rises from 1,000 to 2,000 units, which statement is correct?',
    options: [
      'Total rent doubles to ₹1,00,000.',
      'Total rent stays ₹50,000; total material cost rises from ₹20,000 to ₹40,000.',
      'Per-unit rent stays constant.',
      'Material cost stays ₹20,000.',
    ],
    correctOption: 1,
    explanation:
      'Rent is a fixed cost, total stays ₹50,000 (though per-unit fixed cost falls as output rises). Raw material is a variable cost, total varies with output: 1,000×₹20 = ₹20,000 rises to 2,000×₹20 = ₹40,000.',
  },
  {
    slug: 'cs-com-time-value',
    title: 'Time Value of Money',
    difficulty: 'medium',
    topics: ['Corporate Finance'],
    domain: 'commerce',
    description:
      'You can receive ₹1,000 today or ₹1,000 one year from now, with a positive market interest rate. Ignoring risk, which is worth more and why?',
    options: [
      'Both are equal because the amount is the same.',
      '₹1,000 today, because it can be invested to earn interest (a rupee today is worth more than a rupee tomorrow).',
      '₹1,000 next year, because of inflation.',
      'It depends only on your tax rate.',
    ],
    correctOption: 1,
    explanation:
      'The time value of money: a rupee today can be invested to earn a return, so it is worth more than the same rupee received later. The future ₹1,000 must be discounted to its present value, which is below ₹1,000.',
  },
  {
    slug: 'cs-com-break-even',
    title: 'Break-Even Point',
    difficulty: 'medium',
    topics: ['Cost & Management Accounting'],
    domain: 'commerce',
    description:
      'A product sells for ₹100, has a variable cost of ₹60 per unit, and fixed costs of ₹2,00,000. How many units must be sold to break even?',
    options: ['2,000 units.', '5,000 units.', '3,333 units.', '10,000 units.'],
    correctOption: 1,
    explanation:
      'Contribution per unit = price − variable cost = ₹100 − ₹60 = ₹40. Break-even units = fixed costs / contribution per unit = 2,00,000 / 40 = 5,000 units.',
  },
  {
    slug: 'cs-com-audit-opinion',
    title: 'Type of Audit Opinion',
    difficulty: 'hard',
    topics: ['Auditing'],
    domain: 'commerce',
    description:
      'An auditor finds the financial statements are materially misstated AND the misstatement is so pervasive that the statements as a whole are unreliable. Which audit opinion should be issued?',
    options: [
      'Unqualified (clean) opinion.',
      'Adverse opinion.',
      'Qualified ("except for") opinion.',
      'Disclaimer of opinion.',
    ],
    correctOption: 1,
    explanation:
      'When misstatements are both material and pervasive, the statements as a whole do not give a true and fair view, so the auditor issues an adverse opinion. A qualified opinion is for material-but-not-pervasive issues; a disclaimer is for an inability to obtain sufficient evidence.',
  },
];

async function main() {
  const p = new PrismaClient();

  // Domains
  const domainId: Record<string, string> = {};
  for (const d of DOMAINS) {
    const row = await p.practiceDomain.upsert({
      where: { slug: d.slug },
      update: { name: d.name, icon: d.icon, sortOrder: d.sortOrder },
      create: { slug: d.slug, name: d.name, icon: d.icon, sortOrder: d.sortOrder },
    });
    domainId[d.slug] = row.id;
  }

  let created = 0;
  for (const q of QUESTIONS) {
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
        domains: { set: [{ id: domainId[q.domain] }] },
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
        domains: { connect: [{ id: domainId[q.domain] }] },
      },
    });
    created += 1;
  }

  console.log(`Seeded ${DOMAINS.length} domains and ${created} case-study MCQs.`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
