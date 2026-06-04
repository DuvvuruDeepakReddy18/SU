export const QUEUE_NAMES = {
  RESUME_PARSE: 'resume-parse',
  GITHUB_SYNC: 'github-sync',
  JUDGE_RUN: 'judge-run',
  AI_FEEDBACK: 'ai-feedback',
  VERIFICATION_RECOMPUTE: 'verification-recompute',
  LEADERBOARD_BUILD: 'leaderboard-build',
  NOTIFICATION_FANOUT: 'notification-fanout',
  // College-ID + marksheet OCR. Job names within this queue:
  //   "screen-college-id" → CollegeIdService.screen(userId)
  //   "process-marksheet" → AcademicRecordService.processOcrForRecord(recordId)
  VERIFICATION_SCREEN: 'verification-screen',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job names within the VERIFICATION_SCREEN queue. Discriminator for the worker.
export const VERIFICATION_JOBS = {
  SCREEN_COLLEGE_ID: 'screen-college-id',
  PROCESS_MARKSHEET: 'process-marksheet',
} as const;
export type VerificationJobName = (typeof VERIFICATION_JOBS)[keyof typeof VERIFICATION_JOBS];
