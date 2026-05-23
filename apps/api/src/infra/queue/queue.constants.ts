export const QUEUE_NAMES = {
  RESUME_PARSE: 'resume-parse',
  GITHUB_SYNC: 'github-sync',
  JUDGE_RUN: 'judge-run',
  AI_FEEDBACK: 'ai-feedback',
  VERIFICATION_RECOMPUTE: 'verification-recompute',
  LEADERBOARD_BUILD: 'leaderboard-build',
  NOTIFICATION_FANOUT: 'notification-fanout',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
