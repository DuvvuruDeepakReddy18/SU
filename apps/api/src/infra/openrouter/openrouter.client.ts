import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

/**
 * Thin wrapper around the OpenAI SDK pointed at OpenRouter.
 * Free models on OpenRouter rotate in/out of upstream rate limits; we accept
 * a list of fallback model slugs and retry on 429 / 402 (insufficient quota).
 * Models don't reliably support response_format=json_object, so we extract
 * the first {...} block from the text response.
 */
@Injectable()
export class OpenRouterClient {
  private readonly log = new Logger(OpenRouterClient.name);
  readonly client: OpenAI | null;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      this.client = null;
      return;
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME ?? 'SkillVerify',
      },
    });
  }

  async chatJson(
    models: string[],
    system: string,
    user: string,
    maxTokens = 2_000,
  ): Promise<unknown> {
    if (!this.client) throw new Error('OPENROUTER_API_KEY is not configured');
    const tried: string[] = [];
    let lastErr: unknown = null;

    for (const model of models) {
      tried.push(model);
      try {
        const res = await this.client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        });
        const content = res.choices[0]?.message?.content;
        if (!content || !content.trim()) {
          this.log.warn(`Empty content from ${model}, trying next fallback`);
          continue;
        }
        return JSON.parse(this.extractJson(content));
      } catch (e) {
        lastErr = e;
        const status = (e as { status?: number }).status;
        const msg = (e as Error).message ?? '';
        if (
          status === 429 ||
          status === 402 ||
          msg.includes('rate-limit') ||
          msg.includes('quota')
        ) {
          this.log.warn(`${model} failed (${status}: ${msg.slice(0, 100)}), trying fallback`);
          continue;
        }
        // Other errors (auth, model-not-found, bad request): give up
        throw e;
      }
    }

    throw new Error(
      `All ${tried.length} OpenRouter models failed: ${tried.join(', ')}. Last error: ${
        (lastErr as Error)?.message ?? 'unknown'
      }`,
    );
  }

  private extractJson(s: string): string {
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start < 0 || end < 0) {
      this.log.error(`No JSON in response: ${s.slice(0, 200)}`);
      throw new Error('No JSON object in model response');
    }
    return s.slice(start, end + 1);
  }
}
