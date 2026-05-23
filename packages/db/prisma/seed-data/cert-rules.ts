// Admin-curated certification → tier mapping rules.
// (issuer, courseName) is unique.

import type { CertificationTier } from '@prisma/client';

type Rule = {
  issuer: string;
  courseName: string;
  skillName?: string;
  tier: CertificationTier;
};

export const CERT_RULES: Rule[] = [
  // TIER 1 — heavyweight, generally industry-recognized
  {
    issuer: 'AWS',
    courseName: 'AWS Certified Solutions Architect – Professional',
    skillName: 'AWS',
    tier: 'TIER_1',
  },
  {
    issuer: 'AWS',
    courseName: 'AWS Certified DevOps Engineer – Professional',
    skillName: 'AWS',
    tier: 'TIER_1',
  },
  {
    issuer: 'Google Cloud',
    courseName: 'Professional Cloud Architect',
    skillName: 'Google Cloud Platform',
    tier: 'TIER_1',
  },
  {
    issuer: 'Google Cloud',
    courseName: 'Professional Data Engineer',
    skillName: 'Google Cloud Platform',
    tier: 'TIER_1',
  },
  {
    issuer: 'Microsoft',
    courseName: 'Azure Solutions Architect Expert',
    skillName: 'Microsoft Azure',
    tier: 'TIER_1',
  },
  {
    issuer: 'CNCF',
    courseName: 'Certified Kubernetes Administrator',
    skillName: 'Kubernetes',
    tier: 'TIER_1',
  },
  {
    issuer: 'CNCF',
    courseName: 'Certified Kubernetes Application Developer',
    skillName: 'Kubernetes',
    tier: 'TIER_1',
  },
  {
    issuer: 'HashiCorp',
    courseName: 'Terraform Associate',
    skillName: 'Terraform',
    tier: 'TIER_1',
  },
  { issuer: 'Oracle', courseName: 'Java SE 17 Developer', skillName: 'Java', tier: 'TIER_1' },
  { issuer: '(ISC)2', courseName: 'CISSP', skillName: 'Cryptography', tier: 'TIER_1' },
  {
    issuer: 'EC-Council',
    courseName: 'Certified Ethical Hacker',
    skillName: 'Penetration Testing',
    tier: 'TIER_1',
  },
  {
    issuer: 'Offensive Security',
    courseName: 'OSCP',
    skillName: 'Penetration Testing',
    tier: 'TIER_1',
  },
  { issuer: 'PMI', courseName: 'PMP', skillName: 'Product Management', tier: 'TIER_1' },
  {
    issuer: 'NVIDIA',
    courseName: 'Deep Learning Institute – Fundamentals',
    skillName: 'PyTorch',
    tier: 'TIER_1',
  },

  // TIER 2 — solid, specialist
  {
    issuer: 'AWS',
    courseName: 'AWS Certified Solutions Architect – Associate',
    skillName: 'AWS',
    tier: 'TIER_2',
  },
  {
    issuer: 'AWS',
    courseName: 'AWS Certified Developer – Associate',
    skillName: 'AWS',
    tier: 'TIER_2',
  },
  {
    issuer: 'AWS',
    courseName: 'AWS Certified SysOps Administrator',
    skillName: 'AWS',
    tier: 'TIER_2',
  },
  {
    issuer: 'Google Cloud',
    courseName: 'Associate Cloud Engineer',
    skillName: 'Google Cloud Platform',
    tier: 'TIER_2',
  },
  {
    issuer: 'Microsoft',
    courseName: 'Azure Administrator Associate',
    skillName: 'Microsoft Azure',
    tier: 'TIER_2',
  },
  {
    issuer: 'Microsoft',
    courseName: 'Azure Developer Associate',
    skillName: 'Microsoft Azure',
    tier: 'TIER_2',
  },
  {
    issuer: 'MongoDB University',
    courseName: 'M220JS MongoDB for Developers',
    skillName: 'MongoDB',
    tier: 'TIER_2',
  },
  {
    issuer: 'Confluent',
    courseName: 'Confluent Certified Developer for Apache Kafka',
    skillName: 'Apache Kafka',
    tier: 'TIER_2',
  },
  {
    issuer: 'Databricks',
    courseName: 'Certified Data Engineer Associate',
    skillName: 'Apache Spark',
    tier: 'TIER_2',
  },
  {
    issuer: 'Meta',
    courseName: 'Front-End Developer Professional Certificate',
    skillName: 'React',
    tier: 'TIER_2',
  },
  {
    issuer: 'Meta',
    courseName: 'Back-End Developer Professional Certificate',
    skillName: 'Node.js',
    tier: 'TIER_2',
  },
  {
    issuer: 'IBM',
    courseName: 'Data Science Professional Certificate',
    skillName: 'Pandas',
    tier: 'TIER_2',
  },
  {
    issuer: 'Google',
    courseName: 'Data Analytics Professional Certificate',
    skillName: 'SQL',
    tier: 'TIER_2',
  },
  {
    issuer: 'Google',
    courseName: 'UX Design Professional Certificate',
    skillName: 'UX Research',
    tier: 'TIER_2',
  },
  {
    issuer: 'DeepLearning.AI',
    courseName: 'Deep Learning Specialization',
    skillName: 'TensorFlow',
    tier: 'TIER_2',
  },
  {
    issuer: 'Stanford Online',
    courseName: 'Machine Learning Specialization',
    skillName: 'Scikit-learn',
    tier: 'TIER_2',
  },
  { issuer: 'Hugging Face', courseName: 'NLP Course', skillName: 'NLP', tier: 'TIER_2' },
  { issuer: 'GitHub', courseName: 'GitHub Actions', skillName: 'GitHub Actions', tier: 'TIER_2' },

  // TIER 3 — entry / introductory
  { issuer: 'AWS', courseName: 'AWS Cloud Practitioner', skillName: 'AWS', tier: 'TIER_3' },
  {
    issuer: 'Google Cloud',
    courseName: 'Cloud Digital Leader',
    skillName: 'Google Cloud Platform',
    tier: 'TIER_3',
  },
  {
    issuer: 'Microsoft',
    courseName: 'Azure Fundamentals AZ-900',
    skillName: 'Microsoft Azure',
    tier: 'TIER_3',
  },
  {
    issuer: 'freeCodeCamp',
    courseName: 'Responsive Web Design',
    skillName: 'Tailwind CSS',
    tier: 'TIER_3',
  },
  {
    issuer: 'freeCodeCamp',
    courseName: 'JavaScript Algorithms and Data Structures',
    skillName: 'JavaScript',
    tier: 'TIER_3',
  },
  {
    issuer: 'freeCodeCamp',
    courseName: 'Front End Development Libraries',
    skillName: 'React',
    tier: 'TIER_3',
  },
  { issuer: 'Coursera', courseName: 'Python for Everybody', skillName: 'Python', tier: 'TIER_3' },
  { issuer: 'Coursera', courseName: 'Crash Course on Python', skillName: 'Python', tier: 'TIER_3' },
  {
    issuer: 'Udemy',
    courseName: 'The Complete JavaScript Course',
    skillName: 'JavaScript',
    tier: 'TIER_3',
  },
  {
    issuer: 'Udemy',
    courseName: 'The Web Developer Bootcamp',
    skillName: 'JavaScript',
    tier: 'TIER_3',
  },
  { issuer: 'NPTEL', courseName: 'Programming in Java', skillName: 'Java', tier: 'TIER_3' },
  {
    issuer: 'NPTEL',
    courseName: 'Programming, Data Structures and Algorithms using Python',
    skillName: 'Python',
    tier: 'TIER_3',
  },
  {
    issuer: 'HackerRank',
    courseName: 'Problem Solving (Basic)',
    skillName: 'Problem Solving',
    tier: 'TIER_3',
  },
  { issuer: 'HackerRank', courseName: 'SQL (Intermediate)', skillName: 'SQL', tier: 'TIER_3' },
  {
    issuer: 'LinkedIn Learning',
    courseName: 'Git Essential Training',
    skillName: 'Git',
    tier: 'TIER_3',
  },
  { issuer: 'CompTIA', courseName: 'Security+', skillName: 'OWASP Top 10', tier: 'TIER_3' },
];
