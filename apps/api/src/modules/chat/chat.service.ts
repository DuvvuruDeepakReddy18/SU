import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';

// Free models that handle structured chat well. Fallback chain matches what
// resume parsing and code review already use.
const CHAT_MODELS = [
  process.env.OPENROUTER_CHAT_MODEL_PRIMARY ?? 'openai/gpt-oss-120b:free',
  process.env.OPENROUTER_CHAT_MODEL_FALLBACK ?? 'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

@Injectable()
export class ChatService {
  private readonly log = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterClient,
  ) {}

  /**
   * Main chat entrypoint. Detects retrieval intent from the latest user
   * message (currently only "find me X" peer-lookups), pulls structured
   * results from Postgres, and injects them as a system context block
   * before calling the LLM. Returns plain text.
   */
  async chat(
    userId: string,
    messages: ChatMessage[],
  ): Promise<{ reply: string; usedRetrieval: boolean }> {
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        reply:
          "AI chat isn't configured on this server (OPENROUTER_API_KEY is missing). Ask your admin to set it.",
        usedRetrieval: false,
      };
    }

    const latest = messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: { include: { institution: true } } },
    });

    // Look-aside retrieval. Cheap heuristic — looks for "find" / "who" /
    // "looking for" + a skill keyword. Returns a list of verified peers in
    // the user's institution.
    let retrieval = '';
    let usedRetrieval = false;
    const looksLikeFind =
      /\b(find|who|looking for|need|recommend|suggest)\b/i.test(latest) &&
      /\b(skill|developer|engineer|designer|manager|analyst|marketer|product|data|ml|frontend|backend|fullstack|writer|video)\b/i.test(
        latest,
      );
    if (looksLikeFind && profile?.user.institution) {
      const peers = await this.findVerifiedPeers(profile.user.institution.id, latest, userId);
      if (peers.length > 0) {
        retrieval =
          'Here are verified peers from the same institution that match the request:\n' +
          peers
            .map(
              (p, i) =>
                `${i + 1}. ${p.fullName} — skills: ${p.skills.join(', ')}; verified up to ${
                  p.maxLayer
                }. Portfolio: /u/${p.slug}`,
            )
            .join('\n');
        usedRetrieval = true;
      } else {
        retrieval =
          'No verified peers in the same institution matched. Suggest the user broaden their search or invite a peer.';
        usedRetrieval = true;
      }
    } else if (profile?.user.institution) {
      // College Q&A: pull the institution's own knowledge base so the bot can
      // answer college-specific questions ONLY from verified facts (no hallucination).
      const facts = await this.findInstitutionKnowledge(profile.user.institution.id, latest);
      if (facts.length > 0) {
        retrieval =
          `COLLEGE INFO for ${profile.user.institution.name} (answer college-specific questions ONLY from these facts):\n` +
          facts.map((f, i) => `${i + 1}. [${f.title}] ${f.content}`).join('\n');
        usedRetrieval = true;
      }
    }

    const system = this.buildSystemPrompt(profile, retrieval);

    try {
      // openrouter.client.chatJson expects a JSON response. Here we want
      // plain text, so call the underlying client directly via fetch-like
      // semantics. Re-using `chatJson` would force a JSON wrapper.
      const out = await this.chatPlain(CHAT_MODELS, system, messages);
      return { reply: out, usedRetrieval };
    } catch (e) {
      this.log.error(`Chat failed: ${(e as Error).message}`);
      return {
        reply:
          'Sorry — my AI backend hit an error just now. Try again in a moment, or rephrase the question.',
        usedRetrieval: false,
      };
    }
  }

  /**
   * Returns up to 5 students in the same institution who have at least one
   * skill matching the keywords in `query`, ranked by their highest
   * verification layer.
   */
  private async findVerifiedPeers(institutionId: string, query: string, excludeUserId: string) {
    // Strip non-alpha noise; keep words ≥ 4 chars as skill seeds.
    const words = query
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
      .slice(0, 6);
    if (words.length === 0) return [];

    const rows = await this.prisma.userSkill.findMany({
      where: {
        highestVerificationLayer: { in: ['L1_ACADEMIC', 'L2_CERTIFIED', 'L3_PROVEN', 'L4_EXPERT'] },
        user: { institutionId, id: { not: excludeUserId } },
        skill: { name: { in: words, mode: 'insensitive' } },
      },
      include: {
        skill: { select: { name: true } },
        user: {
          select: {
            id: true,
            studentProfile: { select: { fullName: true, sharableSlug: true } },
          },
        },
      },
      take: 50,
    });

    // Aggregate per user — collect their matching skills + best layer.
    const byUser = new Map<
      string,
      { fullName: string; slug: string; skills: Set<string>; maxLayer: string }
    >();
    const LAYER_ORDER = ['L1_ACADEMIC', 'L2_CERTIFIED', 'L3_PROVEN', 'L4_EXPERT'];
    for (const r of rows) {
      if (!r.user.studentProfile) continue;
      const existing = byUser.get(r.user.id);
      const layerIdx = LAYER_ORDER.indexOf(r.highestVerificationLayer);
      if (!existing) {
        byUser.set(r.user.id, {
          fullName: r.user.studentProfile.fullName,
          slug: r.user.studentProfile.sharableSlug,
          skills: new Set([r.skill.name]),
          maxLayer: r.highestVerificationLayer,
        });
      } else {
        existing.skills.add(r.skill.name);
        if (layerIdx > LAYER_ORDER.indexOf(existing.maxLayer)) {
          existing.maxLayer = r.highestVerificationLayer;
        }
      }
    }
    return [...byUser.values()]
      .map((p) => ({ ...p, skills: [...p.skills] }))
      .sort((a, b) => LAYER_ORDER.indexOf(b.maxLayer) - LAYER_ORDER.indexOf(a.maxLayer))
      .slice(0, 5);
  }

  /**
   * Keyword retrieval over the institution's knowledge base. Returns matching
   * facts (or none). The chat() flow injects these as grounding context so the
   * bot answers college questions only from real data.
   */
  private async findInstitutionKnowledge(institutionId: string, query: string) {
    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
      .slice(0, 8);
    if (words.length === 0) return [];
    return this.prisma.institutionKnowledge.findMany({
      where: {
        institutionId,
        OR: words.map((w) => ({ content: { contains: w, mode: 'insensitive' as const } })),
      },
      select: { title: true, content: true },
      take: 8,
    });
  }

  private buildSystemPrompt(
    profile: {
      fullName: string;
      user: { institution: { name: string } | null };
    } | null,
    retrieval: string,
  ): string {
    const institutionLine =
      profile?.user.institution?.name ?? 'an unknown institution (no institution registered yet)';
    return `You are SkillBot, the in-app assistant for SkillVerify — a verified skill portfolio platform for college students in India.

The user you are talking to is ${profile?.fullName ?? 'a student'} from ${institutionLine}.

What you help with:
- Answer questions about the student's OWN college, ${institutionLine}, using the COLLEGE INFO facts below (admissions, courses, campuses, fees, contacts)
- Explain how the 4-layer verification works (L1 Academic, L2 Certified, L3 Proof-of-Work, L4 Expert Screen)
- Walk students through the verification center: uploading semester marksheets, college ID, certifications
- Help them find verified peers in their own institution for collaborations
- Suggest practice domains or competitions based on their stated interests

You are scoped to THIS student's college, not a directory of all colleges. If they ask vaguely what you know, or about colleges in general, clarify that you can answer questions about their college (${institutionLine}) — give a couple of examples like admissions or campuses — plus the SkillVerify tasks above.

Keep replies under 6 sentences unless the user explicitly asks for detail. Use bullet points when listing.
Never invent URLs or stats.

ANSWERING QUESTIONS ABOUT THE STUDENT'S COLLEGE (admissions, fees, courses, hostel, placements, scholarships, deadlines, departments, contacts, etc.):
- Use ONLY the "COLLEGE INFO" facts in the retrieval context below. Quote them faithfully.
- If the needed fact is NOT in that context, DO NOT guess and DO NOT rely on general knowledge about the college. Say you don't have that detail yet, and suggest they contact their college / TPO office for the exact answer.

For SkillVerify platform questions (verification, practice, finding peers), answer normally; if unsure, point to the right page (/dashboard/profile, /dashboard/verifications, /dashboard/practice, /support).

${retrieval ? `--- RETRIEVAL CONTEXT (injected this turn) ---\n${retrieval}\n--- END CONTEXT ---\n\nUse this context to answer; if it's empty for a "find me X" request, explain that gracefully.` : ''}`;
  }

  /**
   * Plain-text completion using the OpenRouter SDK already initialized in
   * the client wrapper. Bypasses chatJson because we don't want JSON parsing.
   */
  private async chatPlain(
    models: string[],
    system: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const client = this.openrouter.client;
    if (!client) throw new Error('OPENROUTER_API_KEY is not configured');

    // OpenAI SDK demands a discriminated union for role; cast each message
    // through `as const` so TypeScript infers the literal type.
    const formatted = [
      { role: 'system' as const, content: system },
      ...messages.map((m) =>
        m.role === 'assistant'
          ? { role: 'assistant' as const, content: m.content }
          : m.role === 'system'
            ? { role: 'system' as const, content: m.content }
            : { role: 'user' as const, content: m.content },
      ),
    ];

    let lastErr: unknown = null;
    for (const model of models) {
      try {
        const res = await client.chat.completions.create({
          model,
          max_tokens: 700,
          temperature: 0.4,
          messages: formatted,
        });
        const text = res.choices[0]?.message?.content;
        if (text && text.trim()) return text.trim();
        this.log.warn(`Empty chat content from ${model}; trying next fallback`);
      } catch (e) {
        lastErr = e;
        const status = (e as { status?: number }).status;
        if (status === 429 || status === 402 || status === 404) {
          this.log.warn(`${model} rate-limited / unavailable; trying fallback`);
          continue;
        }
        throw e;
      }
    }
    throw new Error(`All chat models failed: ${(lastErr as Error)?.message ?? 'unknown'}`);
  }
}

const STOPWORDS = new Set([
  'find',
  'recommend',
  'need',
  'help',
  'looking',
  'want',
  'with',
  'from',
  'this',
  'that',
  'have',
  'good',
  'best',
  'someone',
  'people',
  'person',
  'team',
  'team-mate',
  'partner',
  'college',
  'institute',
  'institution',
  'skill',
  'skills',
  'about',
  'please',
  'thank',
  'thanks',
  'would',
  'could',
  'should',
  'really',
  'right',
  'know',
  'tell',
  'show',
  'give',
]);
