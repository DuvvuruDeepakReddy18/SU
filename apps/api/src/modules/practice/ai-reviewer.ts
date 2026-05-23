import { Injectable, Logger } from '@nestjs/common';
import { AiFeedbackSchema, type AiFeedback } from '@skillverify/shared';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';

const REVIEW_SYSTEM = `You are a strict, kind senior engineer reviewing a student's solution.
You receive: problem title, language, the code, and the verdict (AC = Accepted, WA = Wrong Answer, TLE = Time Limit Exceeded, RE = Runtime Error, CE = Compile Error, PENDING = not executed).
Return STRICT JSON matching:
{
  "correctness": string,        // 1-2 sentences explaining whether logic is right; on non-AC, the most likely failure mode
  "timeComplexity": string,
  "spaceComplexity": string,
  "style": string,              // naming, readability, idioms
  "suggestions": string[],      // 2-4 concrete, actionable improvements
  "rating": integer 1-10
}
On non-AC verdicts, "correctness" MUST call out the likely root cause and "suggestions" MUST include a fix. Be concise. No markdown. No prose outside the JSON.`;

const HINT_SYSTEM = `You are a programming tutor giving a single Socratic HINT — never the full solution.
Return STRICT JSON: { "hint": string }
The hint is 1-3 sentences. Suggest the approach (e.g. two pointers, hash map, DP state) and ONE concrete data structure or invariant to consider. Do NOT write code. Do NOT walk through the algorithm in detail. Do NOT spoil edge cases.`;

const EXPLAIN_SYSTEM = `You are a programming tutor breaking down a problem statement.
Return STRICT JSON:
{
  "restatement": string,        // the problem in plain English, 1-2 sentences
  "inputsOutputs": string,      // what comes in, what goes out, types & shapes
  "constraints": string,        // the binding constraints worth thinking about
  "edgeCases": string[]         // 3-5 edge cases to plan for
}
Do NOT reveal the algorithm. Do NOT write code. Just clarify what's being asked.`;

const DRAFT_REVIEW_SYSTEM = `You are pair-programming with a student. They share their in-progress code.
Return STRICT JSON:
{
  "observations": string[],     // 2-4 things you notice (good or concerning)
  "questions": string[],        // 1-3 Socratic questions to guide their next step
  "warnings": string[],         // 0-3 specific bugs/issues you spot
  "completeness": string        // brief assessment of how close it is
}
Guide, don't dictate. Don't hand them the solution.`;

export type ProblemHint = { hint: string };
export type ProblemExplanation = {
  restatement: string;
  inputsOutputs: string;
  constraints: string;
  edgeCases: string[];
};
export type DraftReview = {
  observations: string[];
  questions: string[];
  warnings: string[];
  completeness: string;
};

@Injectable()
export class AiReviewer {
  private readonly log = new Logger(AiReviewer.name);

  constructor(private readonly openRouter: OpenRouterClient) {}

  async review(
    problemTitle: string,
    language: string,
    code: string,
    verdict: string,
  ): Promise<AiFeedback> {
    if (!this.openRouter.client) return this.placeholderReview();
    const json = await this.openRouter.chatJson(
      this.modelList(),
      REVIEW_SYSTEM,
      `Problem: ${problemTitle}\nLanguage: ${language}\nVerdict: ${verdict}\n\nSolution:\n\`\`\`${language}\n${code}\n\`\`\``,
      900,
    );
    return AiFeedbackSchema.parse(json);
  }

  async hint(problemTitle: string, description: string): Promise<ProblemHint> {
    if (!this.openRouter.client) {
      return { hint: 'AI hints are disabled — set OPENROUTER_API_KEY to enable.' };
    }
    const json = (await this.openRouter.chatJson(
      this.modelList(),
      HINT_SYSTEM,
      `Problem: ${problemTitle}\n\n${description}`,
      300,
    )) as ProblemHint;
    return { hint: String(json.hint ?? '').slice(0, 800) };
  }

  async explain(
    problemTitle: string,
    description: string,
    constraints: string | null,
  ): Promise<ProblemExplanation> {
    if (!this.openRouter.client) {
      return {
        restatement: 'AI explain is disabled — set OPENROUTER_API_KEY to enable.',
        inputsOutputs: '',
        constraints: '',
        edgeCases: [],
      };
    }
    const json = (await this.openRouter.chatJson(
      this.modelList(),
      EXPLAIN_SYSTEM,
      `Problem: ${problemTitle}\n\nDescription:\n${description}\n\nConstraints:\n${constraints ?? 'n/a'}`,
      700,
    )) as ProblemExplanation;
    return {
      restatement: String(json.restatement ?? ''),
      inputsOutputs: String(json.inputsOutputs ?? ''),
      constraints: String(json.constraints ?? ''),
      edgeCases: Array.isArray(json.edgeCases) ? json.edgeCases.map(String) : [],
    };
  }

  async reviewDraft(
    problemTitle: string,
    description: string,
    language: string,
    code: string,
  ): Promise<DraftReview> {
    if (!this.openRouter.client) {
      return {
        observations: ['AI review is disabled — set OPENROUTER_API_KEY to enable.'],
        questions: [],
        warnings: [],
        completeness: '',
      };
    }
    const json = (await this.openRouter.chatJson(
      this.modelList(),
      DRAFT_REVIEW_SYSTEM,
      `Problem: ${problemTitle}\n\n${description}\n\nLanguage: ${language}\nDraft code:\n\`\`\`${language}\n${code}\n\`\`\``,
      900,
    )) as DraftReview;
    return {
      observations: Array.isArray(json.observations) ? json.observations.map(String) : [],
      questions: Array.isArray(json.questions) ? json.questions.map(String) : [],
      warnings: Array.isArray(json.warnings) ? json.warnings.map(String) : [],
      completeness: String(json.completeness ?? ''),
    };
  }

  private placeholderReview(): AiFeedback {
    return {
      correctness: 'AI feedback disabled — set OPENROUTER_API_KEY to enable.',
      timeComplexity: 'Not analyzed',
      spaceComplexity: 'Not analyzed',
      style: 'Not analyzed',
      suggestions: [],
      rating: 5,
    };
  }

  private modelList(): string[] {
    const primary = process.env.OPENROUTER_FEEDBACK_MODEL ?? 'openai/gpt-oss-20b:free';
    const fallbacks = (process.env.OPENROUTER_FEEDBACK_FALLBACKS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return [primary, ...fallbacks];
  }
}
