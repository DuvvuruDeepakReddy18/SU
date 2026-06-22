/* eslint-disable no-console */
// Seeds non-coding MCQ practice tracks useful for placement / competitive-exam
// prep: Management, Aptitude & Reasoning, English & Verbal, General Knowledge.
// Reuses the kind="mcq" engine. Idempotent (upsert by slug). Re-runnable.
import { PrismaClient } from '@prisma/client';

const DOMAINS = [
  { slug: 'management', name: 'Management', icon: 'Briefcase', sortOrder: 21 },
  { slug: 'aptitude', name: 'Aptitude & Reasoning', icon: 'Puzzle', sortOrder: 22 },
  { slug: 'english', name: 'English & Verbal', icon: 'Languages', sortOrder: 23 },
  { slug: 'general-knowledge', name: 'General Knowledge', icon: 'Globe', sortOrder: 24 },
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
  // ---------------- Management ----------------
  {
    slug: 'mcq-mgmt-marketing-mix',
    title: 'The Marketing Mix',
    difficulty: 'easy',
    topics: ['Marketing Strategy'],
    domain: 'management',
    description: 'The classic 4 Ps of the marketing mix are Product, Price, Place and ___?',
    options: ['People', 'Promotion', 'Process', 'Profit'],
    correctOption: 1,
    explanation:
      'The 4 Ps are Product, Price, Place and Promotion. (People, Process and Physical evidence are the additional 3 Ps of the extended 7-P services mix.)',
  },
  {
    slug: 'mcq-mgmt-swot',
    title: 'Reading a SWOT',
    difficulty: 'easy',
    topics: ['Strategic Management'],
    domain: 'management',
    description:
      'In a SWOT analysis, a new government subsidy for your entire industry is best classified as a(n):',
    options: ['Strength', 'Weakness', 'Opportunity', 'Threat'],
    correctOption: 2,
    explanation:
      'Strengths and Weaknesses are internal to the firm; Opportunities and Threats are external. A favourable external factor like an industry-wide subsidy is an Opportunity.',
  },
  {
    slug: 'mcq-mgmt-maslow',
    title: "Maslow's Hierarchy",
    difficulty: 'easy',
    topics: ['Organizational Behavior'],
    domain: 'management',
    description: "In Maslow's hierarchy of needs, which need sits at the base (most fundamental)?",
    options: ['Esteem needs', 'Self-actualization', 'Physiological needs', 'Safety needs'],
    correctOption: 2,
    explanation:
      "Maslow's pyramid from the base up: Physiological → Safety → Social/Belonging → Esteem → Self-actualization. Physiological needs (food, water, sleep) are the most basic.",
  },
  {
    slug: 'mcq-mgmt-porter',
    title: "Porter's Five Forces",
    difficulty: 'medium',
    topics: ['Strategic Management'],
    domain: 'management',
    description: "Which of the following is NOT one of Porter's Five Forces?",
    options: [
      'Threat of new entrants',
      'Bargaining power of suppliers',
      'Government regulation',
      'Threat of substitute products',
    ],
    correctOption: 2,
    explanation:
      "Porter's Five Forces are: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, and competitive rivalry. Government regulation is not one of the five.",
  },
  {
    slug: 'mcq-mgmt-plc',
    title: 'Product Life Cycle',
    difficulty: 'easy',
    topics: ['Marketing Strategy'],
    domain: 'management',
    description:
      "A product's sales are rising rapidly and profits are increasing as more competitors enter the market. Which stage of the Product Life Cycle is this?",
    options: ['Introduction', 'Growth', 'Maturity', 'Decline'],
    correctOption: 1,
    explanation:
      'In the Growth stage, sales rise quickly, the product gains acceptance, profits increase and competitors enter. Maturity sees sales peak and flatten; Decline sees them fall.',
  },
  {
    slug: 'mcq-mgmt-stp',
    title: 'Segmentation',
    difficulty: 'easy',
    topics: ['Marketing Strategy'],
    domain: 'management',
    description:
      'Dividing a broad market into smaller groups based on age, income and lifestyle is called:',
    options: ['Targeting', 'Positioning', 'Segmentation', 'Branding'],
    correctOption: 2,
    explanation:
      'This is Segmentation, the first step of STP. Targeting is choosing which segments to serve; Positioning is crafting how the brand is perceived in the chosen segment.',
  },
  {
    slug: 'mcq-mgmt-leadership',
    title: 'Leadership Styles',
    difficulty: 'easy',
    topics: ['Organizational Behavior'],
    domain: 'management',
    description:
      'A manager who makes all decisions alone with little or no input from the team is using which leadership style?',
    options: ['Democratic', 'Laissez-faire', 'Autocratic', 'Transformational'],
    correctOption: 2,
    explanation:
      'An autocratic leader centralises decision-making. Democratic leaders involve the team; laissez-faire leaders delegate freely; transformational leaders inspire change through vision.',
  },
  {
    slug: 'mcq-mgmt-functions',
    title: 'Functions of Management',
    difficulty: 'easy',
    topics: ['Operations Management'],
    domain: 'management',
    description:
      'Setting objectives and deciding the course of action in advance is which function of management?',
    options: ['Organizing', 'Planning', 'Controlling', 'Staffing'],
    correctOption: 1,
    explanation:
      'Planning is deciding in advance what to do and how. Organizing arranges resources; Staffing fills roles; Controlling measures performance against the plan.',
  },

  // ---------------- Aptitude & Reasoning ----------------
  {
    slug: 'mcq-apt-percentage',
    title: 'Percentage',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'What is 15% of 200?',
    options: ['15', '30', '25', '45'],
    correctOption: 1,
    explanation: '15% of 200 = (15 / 100) × 200 = 30.',
  },
  {
    slug: 'mcq-apt-ratio',
    title: 'Combining Ratios',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'If A : B = 2 : 3 and B : C = 4 : 5, then A : C = ?',
    options: ['8 : 15', '2 : 5', '8 : 5', '10 : 12'],
    correctOption: 0,
    explanation:
      'Make B common. A : B = 2 : 3 = 8 : 12 and B : C = 4 : 5 = 12 : 15. So A : B : C = 8 : 12 : 15, giving A : C = 8 : 15.',
  },
  {
    slug: 'mcq-apt-time-work',
    title: 'Time and Work',
    difficulty: 'medium',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description:
      'A can finish a job in 10 days and B in 15 days. Working together, how long do they take?',
    options: ['6 days', '12.5 days', '5 days', '25 days'],
    correctOption: 0,
    explanation:
      'Combined rate = 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6 of the job per day, so together they finish in 6 days.',
  },
  {
    slug: 'mcq-apt-speed',
    title: 'Average Speed',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'A car travels 180 km in 3 hours. What is its average speed?',
    options: ['50 km/h', '60 km/h', '90 km/h', '540 km/h'],
    correctOption: 1,
    explanation: 'Average speed = distance / time = 180 / 3 = 60 km/h.',
  },
  {
    slug: 'mcq-apt-simple-interest',
    title: 'Simple Interest',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'Find the simple interest on ₹5,000 at 8% per annum for 2 years.',
    options: ['₹400', '₹800', '₹1,000', '₹1,600'],
    correctOption: 1,
    explanation: 'SI = (P × R × T) / 100 = (5000 × 8 × 2) / 100 = ₹800.',
  },
  {
    slug: 'mcq-apt-series',
    title: 'Number Series',
    difficulty: 'medium',
    topics: ['Logical Reasoning'],
    domain: 'aptitude',
    description: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '44'],
    correctOption: 2,
    explanation:
      'The differences increase by 2 each time: +4, +6, +8, +10, +12. So the next term is 30 + 12 = 42. (The series is n² + n: 1·2, 2·3, 3·4, 4·5, 5·6, 6·7 = 42.)',
  },
  {
    slug: 'mcq-apt-profit-loss',
    title: 'Profit Percentage',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'An item bought for ₹400 is sold for ₹500. What is the profit percentage?',
    options: ['20%', '25%', '100%', '10%'],
    correctOption: 1,
    explanation:
      'Profit = 500 − 400 = ₹100. Profit % = (profit / cost price) × 100 = (100 / 400) × 100 = 25%.',
  },
  {
    slug: 'mcq-apt-average',
    title: 'Averages',
    difficulty: 'easy',
    topics: ['Quantitative Aptitude'],
    domain: 'aptitude',
    description: 'What is the average of 10, 20, 30 and 40?',
    options: ['20', '25', '30', '100'],
    correctOption: 1,
    explanation: 'Average = sum / count = (10 + 20 + 30 + 40) / 4 = 100 / 4 = 25.',
  },

  // ---------------- English & Verbal ----------------
  {
    slug: 'mcq-eng-synonym',
    title: 'Synonym',
    difficulty: 'easy',
    topics: ['Vocabulary'],
    domain: 'english',
    description: "Choose the word closest in meaning to 'ABUNDANT':",
    options: ['Scarce', 'Plentiful', 'Empty', 'Rare'],
    correctOption: 1,
    explanation:
      "'Abundant' means existing in large quantities, i.e. plentiful. 'Scarce' and 'rare' are antonyms.",
  },
  {
    slug: 'mcq-eng-antonym',
    title: 'Antonym',
    difficulty: 'medium',
    topics: ['Vocabulary'],
    domain: 'english',
    description: "Choose the word most OPPOSITE in meaning to 'BENEVOLENT':",
    options: ['Kind', 'Generous', 'Malevolent', 'Charitable'],
    correctOption: 2,
    explanation:
      "'Benevolent' means well-meaning and kind. Its antonym is 'malevolent' (wishing harm). Kind, generous and charitable are synonyms.",
  },
  {
    slug: 'mcq-eng-grammar',
    title: 'Correct Sentence',
    difficulty: 'easy',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Choose the grammatically correct sentence:',
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      'She not like coffee.',
    ],
    correctOption: 2,
    explanation:
      "With third-person singular, use 'does' + base verb: 'She doesn't like coffee.' 'doesn't likes' double-marks the tense; 'don't' is for I/you/we/they.",
  },
  {
    slug: 'mcq-eng-preposition',
    title: 'Since vs For',
    difficulty: 'easy',
    topics: ['Grammar'],
    domain: 'english',
    description: 'Fill in the blank: "He has been living here ___ 2010."',
    options: ['for', 'since', 'from', 'by'],
    correctOption: 1,
    explanation:
      "Use 'since' with a specific point in time (since 2010) and 'for' with a duration (for 14 years). With a start year, 'since' is correct.",
  },
  {
    slug: 'mcq-eng-idiom',
    title: 'Idiom Meaning',
    difficulty: 'medium',
    topics: ['Verbal Ability'],
    domain: 'english',
    description: "What does the idiom 'to bite the bullet' mean?",
    options: [
      'To eat very quickly',
      'To face a difficult situation bravely',
      'To get badly injured',
      'To waste time',
    ],
    correctOption: 1,
    explanation:
      "'To bite the bullet' means to force yourself to do something unpleasant or difficult, and to endure it bravely.",
  },
  {
    slug: 'mcq-eng-one-word',
    title: 'One-Word Substitution',
    difficulty: 'medium',
    topics: ['Vocabulary'],
    domain: 'english',
    description: 'A person who can speak many languages is called a:',
    options: ['Linguist', 'Polyglot', 'Bilingual', 'Orator'],
    correctOption: 1,
    explanation:
      "A 'polyglot' knows or uses several languages. A 'bilingual' person knows two; a 'linguist' studies language; an 'orator' is a skilled public speaker.",
  },
  {
    slug: 'mcq-eng-spot-error',
    title: 'Spot the Error',
    difficulty: 'medium',
    topics: ['Grammar'],
    domain: 'english',
    description:
      'Identify the part of the sentence that contains an error: "One of the boys / have broken / the window / no error."',
    options: ['One of the boys', 'have broken', 'the window', 'No error'],
    correctOption: 1,
    explanation:
      "The subject is 'One' (singular), so the verb must be 'has broken', not 'have broken'. In 'one of the boys', 'of the boys' only describes 'one'.",
  },
  {
    slug: 'mcq-eng-comprehension',
    title: 'Reading Comprehension',
    difficulty: 'easy',
    topics: ['Verbal Ability'],
    domain: 'english',
    description:
      'Read: "Despite the heavy rain, the team continued their practice without a single complaint." What does this most suggest about the team?',
    options: [
      'They were lazy',
      'They were dedicated',
      'They disliked the sport',
      'They cancelled practice',
    ],
    correctOption: 1,
    explanation:
      'Continuing practice in heavy rain "without a single complaint" shows commitment and discipline, i.e. the team was dedicated.',
  },

  // ---------------- General Knowledge ----------------
  {
    slug: 'mcq-gk-longest-river',
    title: 'Rivers of India',
    difficulty: 'easy',
    topics: ['Geography'],
    domain: 'general-knowledge',
    description: 'Which is the longest river flowing within India?',
    options: ['Yamuna', 'Godavari', 'Ganga', 'Brahmaputra'],
    correctOption: 2,
    explanation:
      'The Ganga (~2,525 km) is the longest river within India. The Godavari is the longest of peninsular India; the Brahmaputra is longer overall but flows mostly outside India.',
  },
  {
    slug: 'mcq-gk-fundamental-rights',
    title: 'Fundamental Rights',
    difficulty: 'medium',
    topics: ['Indian Polity'],
    domain: 'general-knowledge',
    description: 'How many Fundamental Rights are currently guaranteed by the Indian Constitution?',
    options: ['5', '6', '7', '9'],
    correctOption: 1,
    explanation:
      'There are currently 6 Fundamental Rights. Originally there were 7; the Right to Property was removed as a fundamental right by the 44th Amendment (1978) and made a legal right.',
  },
  {
    slug: 'mcq-gk-photosynthesis',
    title: 'Photosynthesis',
    difficulty: 'easy',
    topics: ['Science'],
    domain: 'general-knowledge',
    description: 'Which gas do plants primarily absorb from the air during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
    correctOption: 2,
    explanation:
      'Plants absorb carbon dioxide (CO₂) and release oxygen during photosynthesis, using sunlight to convert CO₂ and water into glucose.',
  },
  {
    slug: 'mcq-gk-rbi-year',
    title: 'Reserve Bank of India',
    difficulty: 'medium',
    topics: ['Economy'],
    domain: 'general-knowledge',
    description: 'In which year was the Reserve Bank of India (RBI) established?',
    options: ['1947', '1935', '1950', '1969'],
    correctOption: 1,
    explanation:
      'The RBI was established on 1 April 1935 under the RBI Act, 1934. It was nationalised in 1949.',
  },
  {
    slug: 'mcq-gk-constitution-father',
    title: 'Indian Constitution',
    difficulty: 'easy',
    topics: ['History'],
    domain: 'general-knowledge',
    description: "Who is known as the 'Father of the Indian Constitution'?",
    options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'B. R. Ambedkar', 'Sardar Patel'],
    correctOption: 2,
    explanation:
      'Dr. B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly and is regarded as the chief architect / "Father of the Indian Constitution".',
  },
  {
    slug: 'mcq-gk-sebi',
    title: 'Market Regulator',
    difficulty: 'easy',
    topics: ['Economy'],
    domain: 'general-knowledge',
    description: 'Which body regulates the securities (stock) market in India?',
    options: ['RBI', 'SEBI', 'IRDAI', 'NABARD'],
    correctOption: 1,
    explanation:
      'SEBI (Securities and Exchange Board of India) regulates the securities market. RBI handles banking/monetary policy, IRDAI insurance, and NABARD rural/agricultural finance.',
  },
  {
    slug: 'mcq-gk-everest',
    title: 'World Geography',
    difficulty: 'easy',
    topics: ['Geography'],
    domain: 'general-knowledge',
    description: 'Mount Everest lies on the border of Nepal and which other country?',
    options: ['India', 'China', 'Bhutan', 'Pakistan'],
    correctOption: 1,
    explanation:
      'Mount Everest sits on the border between Nepal and the Tibet Autonomous Region of China.',
  },
  {
    slug: 'mcq-gk-gold-symbol',
    title: 'Chemical Symbols',
    difficulty: 'easy',
    topics: ['Science'],
    domain: 'general-knowledge',
    description: 'What is the chemical symbol for Gold?',
    options: ['Gd', 'Go', 'Au', 'Ag'],
    correctOption: 2,
    explanation:
      "Gold's symbol is Au (from the Latin 'aurum'). Ag is silver (argentum); Gd is gadolinium.",
  },
];

async function main() {
  const p = new PrismaClient();

  const domainId: Record<string, string> = {};
  for (const d of DOMAINS) {
    const row = await p.practiceDomain.upsert({
      where: { slug: d.slug },
      update: { name: d.name, icon: d.icon, sortOrder: d.sortOrder },
      create: { slug: d.slug, name: d.name, icon: d.icon, sortOrder: d.sortOrder },
    });
    domainId[d.slug] = row.id;
  }

  let n = 0;
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
    n += 1;
  }

  console.log(`Seeded ${DOMAINS.length} tracks and ${n} MCQs.`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
