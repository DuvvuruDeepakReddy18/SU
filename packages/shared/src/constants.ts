export const VERIFICATION_LAYERS = [
  'L0_UNVERIFIED',
  'L1_ACADEMIC',
  'L2_CERTIFIED',
  'L3_PROVEN',
  'L4_EXPERT',
] as const;

export const CERT_TIERS = ['TIER_1', 'TIER_2', 'TIER_3', 'UNRANKED'] as const;

export const USER_ROLES = [
  'STUDENT',
  'RECRUITER',
  'INSTITUTION_ADMIN',
  'INTERVIEWER',
  'PLATFORM_ADMIN',
] as const;

export const SUPPORTED_LANGUAGES = ['python', 'javascript', 'cpp', 'java'] as const;

// Judge0 language id mapping. Verify on your Judge0 instance via GET /languages.
export const JUDGE0_LANG_ID: Record<(typeof SUPPORTED_LANGUAGES)[number], number> = {
  python: 71, // Python (3.8.1)
  javascript: 63, // Node.js (12.14.0)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
};

export const DIFFICULTY_POINTS = { easy: 10, medium: 25, hard: 50 } as const;

export const PROVIDERS = ['github', 'linkedin', 'leetcode', 'coursera'] as const;
