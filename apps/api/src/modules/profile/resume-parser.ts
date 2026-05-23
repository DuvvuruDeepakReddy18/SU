import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { ResumeParseSchema, type ResumeParseResult } from '@skillverify/shared';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';

const SYSTEM_PROMPT = `You are a precise resume parser AND profile copywriter.
Return STRICT JSON matching this schema and nothing else:
{
  "fullName": string|null,
  "headline": string,           // REQUIRED — see rules below
  "bio": string,                // REQUIRED — see rules below
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "linkedinUrl": string|null,
  "githubUrl": string|null,
  "leetcodeUrl": string|null,
  "codechefUrl": string|null,
  "portfolioUrl": string|null,
  "education": [{ "institution": string, "degree": string|null, "startYear": number|null, "endYear": number|null, "cgpa": number|null }],
  "skills": string[],
  "projects": [{ "title": string, "description": string|null, "techStack": string[], "repoUrl": string|null, "liveUrl": string|null }],
  "experience": [{ "company": string, "role": string|null, "startDate": string|null, "endDate": string|null, "description": string|null }],
  "certifications": [{ "issuer": string, "courseName": string, "issuedAt": string|null }]
}

RULES FOR HEADLINE (required, single short line, ~60-90 chars, no period):
  • If the resume has an explicit objective/summary/about line, distill it.
  • Otherwise SYNTHESIZE one: combine current degree/role + 1-2 standout focus areas/skills.
  • Examples: "B.Tech ECE @ Amrita · ML & Full-Stack Dev", "Final-year CS undergrad building AI tools", "Product manager intern with a CS background".

RULES FOR BIO (required, 2-3 sentences, ~250-400 chars, first person OR neutral third person):
  • Use the resume's Objective / Summary / About / Profile section verbatim if it reads well.
  • Otherwise SYNTHESIZE: open with who they are (degree + institution), 1 sentence on areas of strength (skills/projects/domains), 1 sentence on aspirations or kind of role they're after.
  • Never leave blank. Never return "Not specified" or similar.

For all other fields use null when data is genuinely missing. Do not invent specific facts (names, dates, numbers).
For social URLs, return the full https:// URL even if the resume shows only a handle.
Return ONLY the JSON object — no markdown, no prose, no code fence.`;

@Injectable()
export class ResumeParser {
  private readonly log = new Logger(ResumeParser.name);

  constructor(private readonly openRouter: OpenRouterClient) {}

  async parse(pdfBuffer: Buffer): Promise<ResumeParseResult> {
    const { text } = await pdfParse(pdfBuffer);
    return this.parseText(text);
  }

  /**
   * Parse resume from raw text (e.g. user pasted from their resume PDF or
   * a LinkedIn export). Skips PDF parsing — same AI flow otherwise.
   */
  async parseText(rawText: string): Promise<ResumeParseResult> {
    if (!this.openRouter.client) {
      this.log.warn('OPENROUTER_API_KEY missing — returning empty parse result');
      return ResumeParseSchema.parse({});
    }

    const trimmed = (rawText ?? '').slice(0, 30_000);
    if (trimmed.trim().length < 30) {
      throw new Error('Resume text is too short to parse (need at least 30 characters).');
    }
    const models = this.modelList();

    const json = await this.openRouter.chatJson(
      models,
      SYSTEM_PROMPT,
      `Resume text:\n\n${trimmed}`,
      4_000,
    );

    // Try the lenient schema first.
    const result = ResumeParseSchema.safeParse(json);
    if (result.success) return result.data;

    this.log.warn(
      `ResumeParseSchema strict-parse failed (${result.error.issues.length} issues). ` +
        `First issue: ${JSON.stringify(result.error.issues[0]).slice(0, 200)}. ` +
        `Falling back to per-field extraction.`,
    );
    return this.lenientExtract(json);
  }

  // Last-resort extraction: drop fields that fail validation rather than
  // throwing the entire parse. mergeParsed synthesizes the user-facing copy
  // (headline, bio) from whatever survives.
  private lenientExtract(raw: unknown): ResumeParseResult {
    const r = (raw ?? {}) as Record<string, unknown>;
    const fields: (keyof ResumeParseResult)[] = [
      'fullName',
      'headline',
      'bio',
      'email',
      'phone',
      'location',
      'linkedinUrl',
      'githubUrl',
      'leetcodeUrl',
      'codechefUrl',
      'portfolioUrl',
    ];
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const single = ResumeParseSchema.shape[f]?.safeParse(r[f]);
      if (single?.success) out[f] = single.data;
    }
    for (const arr of [
      'education',
      'skills',
      'projects',
      'experience',
      'certifications',
    ] as const) {
      const single = ResumeParseSchema.shape[arr]?.safeParse(r[arr]);
      if (single?.success) out[arr] = single.data;
    }
    const second = ResumeParseSchema.safeParse(out);
    return second.success ? second.data : ResumeParseSchema.parse({});
  }

  private modelList(): string[] {
    const primary = process.env.OPENROUTER_RESUME_MODEL ?? 'openai/gpt-oss-120b:free';
    const fallbacks = (process.env.OPENROUTER_RESUME_FALLBACKS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return [primary, ...fallbacks];
  }
}
