'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ProblemLeaderboard } from '@/components/problem-leaderboard';
import { EVENTS, track } from '@/lib/analytics';
import {
  Lightbulb,
  BookOpen,
  MessageSquare,
  Loader2,
  Sparkles,
  AlertTriangle,
  Sun,
  Moon,
  Save,
  Terminal as TerminalIcon,
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
  description: string;
  constraints: string | null;
  examplesJson: { input: string; output: string }[];
  starterCode: Record<string, string>;
};

type FailedTest = {
  input: string;
  expectedOutput: string;
  gotStdout: string;
  stderr: string | null;
  compileOutput: string | null;
  status: string;
};

type Submission = {
  id: string;
  verdict: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  testsPassed: number | null;
  testsTotal: number | null;
  failedTest: FailedTest | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiFeedback: any;
};

type Hint = { hint: string };
type Explanation = {
  restatement: string;
  inputsOutputs: string;
  constraints: string;
  edgeCases: string[];
};
type DraftReview = {
  observations: string[];
  questions: string[];
  warnings: string[];
  completeness: string;
};

const LANGS: { value: 'python' | 'javascript' | 'cpp' | 'java'; monaco: string }[] = [
  { value: 'python', monaco: 'python' },
  { value: 'javascript', monaco: 'javascript' },
  { value: 'cpp', monaco: 'cpp' },
  { value: 'java', monaco: 'java' },
];

export default function ProblemPage({ params }: { params: { slug: string } }) {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data: problem } = useQuery({
    queryKey: ['problem', params.slug],
    queryFn: () => api<Problem>(`/practice/problems/${params.slug}`),
  });

  const [lang, setLang] = useState<(typeof LANGS)[number]['value']>('python');
  const [code, setCode] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<'hint' | 'explain' | 'review' | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReview | null>(null);

  const { data: sub } = useQuery({
    enabled: !!submissionId && !!token,
    queryKey: ['submission', submissionId],
    queryFn: () => api<Submission>(`/practice/submissions/${submissionId}`, { token }),
    refetchInterval: (q) => (q.state.data?.verdict === 'PENDING' ? 1500 : false),
  });

  // Fire "first problem solved" once per user, ever. localStorage avoids an
  // extra API hit and survives across sessions. The event itself is harmless
  // if it fires twice (PostHog dedups by distinctId), but we're polite.
  useEffect(() => {
    if (sub?.verdict !== 'AC' || typeof window === 'undefined') return;
    const userKey = (session as { user?: { email?: string } } | null)?.user?.email ?? 'anon';
    const flag = `sv:first-ac:${userKey}`;
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, '1');
    track(EVENTS.FIRST_PROBLEM_SOLVED, { slug: params.slug, language: lang });
  }, [sub?.verdict, session, params.slug, lang]);

  const submit = useMutation({
    mutationFn: () =>
      api<Submission>('/practice/submissions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          problemId: problem!.id,
          language: lang,
          code: code || problem!.starterCode[lang],
        }),
      }),
    onSuccess: (s) => {
      setSubmissionId(s.id);
      toast.success('Submitted. Running tests…');
      qc.invalidateQueries({ queryKey: ['submission'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const getHint = useMutation({
    mutationFn: () =>
      api<Hint>(`/practice/problems/${params.slug}/hint`, { method: 'POST', token }),
    onSuccess: (d) => {
      setHint(d);
      setAiTab('hint');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const getExplain = useMutation({
    mutationFn: () =>
      api<Explanation>(`/practice/problems/${params.slug}/explain`, { method: 'POST', token }),
    onSuccess: (d) => {
      setExplanation(d);
      setAiTab('explain');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const getReview = useMutation({
    mutationFn: () =>
      api<DraftReview>(`/practice/problems/${params.slug}/review-draft`, {
        method: 'POST',
        token,
        body: JSON.stringify({ language: lang, code: code || problem!.starterCode[lang] }),
      }),
    onSuccess: (d) => {
      setDraftReview(d);
      setAiTab('review');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!problem) return <div className="animate-pulse h-96 rounded bg-secondary" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] h-[calc(100vh-9rem)]">
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{problem.title}</span>
            <Badge
              variant={
                problem.difficulty === 'easy'
                  ? 'success'
                  : problem.difficulty === 'medium'
                    ? 'default'
                    : 'warning'
              }
            >
              {problem.difficulty}
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground">{problem.topics.join(' · ')}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => getHint.mutate()}
              disabled={getHint.isPending}
            >
              {getHint.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5" />
              )}
              Hint
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => getExplain.mutate()}
              disabled={getExplain.isPending}
            >
              {getExplain.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
              Explain
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => getReview.mutate()}
              disabled={getReview.isPending || (!code && !problem.starterCode?.[lang])}
            >
              {getReview.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              Review my code
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto">
          {aiTab === 'hint' && hint && (
            <AiPanel title="Hint" icon={Lightbulb} onClose={() => setAiTab(null)}>
              <p>{hint.hint}</p>
            </AiPanel>
          )}
          {aiTab === 'explain' && explanation && (
            <AiPanel title="Problem breakdown" icon={BookOpen} onClose={() => setAiTab(null)}>
              <Section label="In plain English" value={explanation.restatement} />
              <Section label="Inputs / Outputs" value={explanation.inputsOutputs} />
              <Section label="Key constraints" value={explanation.constraints} />
              {explanation.edgeCases.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Edge cases to consider
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {explanation.edgeCases.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AiPanel>
          )}
          {aiTab === 'review' && draftReview && (
            <AiPanel
              title="Pair review of your draft"
              icon={MessageSquare}
              onClose={() => setAiTab(null)}
            >
              {draftReview.completeness && (
                <p className="italic text-muted-foreground">{draftReview.completeness}</p>
              )}
              {draftReview.observations.length > 0 && (
                <Bullets label="Observations" items={draftReview.observations} />
              )}
              {draftReview.warnings.length > 0 && (
                <Bullets
                  label="Watch out for"
                  items={draftReview.warnings}
                  icon={AlertTriangle}
                  tone="warning"
                />
              )}
              {draftReview.questions.length > 0 && (
                <Bullets label="Questions to consider" items={draftReview.questions} />
              )}
            </AiPanel>
          )}

          <div>
            <h4 className="text-sm font-semibold">Problem</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm">{problem.description}</p>
          </div>

          {problem.constraints && (
            <pre className="rounded bg-secondary p-3 text-xs whitespace-pre-wrap">
              {problem.constraints}
            </pre>
          )}

          <div>
            <h4 className="text-sm font-semibold">Examples</h4>
            <div className="mt-2 space-y-2">
              {problem.examplesJson.map((ex, i) => (
                <div key={i} className="rounded border p-3 text-xs">
                  <div>
                    <strong>Input:</strong> {ex.input}
                  </div>
                  <div>
                    <strong>Output:</strong> {ex.output}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance reminder — nudges optimal complexity over brute force. */}
          <div className="rounded-md border border-amber-300/50 bg-amber-50 p-3 text-xs dark:border-amber-800/40 dark:bg-amber-950/20">
            <strong className="font-semibold">Mind your complexity.</strong> Submissions run against
            hidden tests with a 2-second limit. Aim for the optimal time and space complexity; a
            brute-force solution may time out (TLE) on large inputs.
          </div>

          {problem.topics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold">Brush up the concepts</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {problem.topics.map((t) => (
                  <a
                    key={t}
                    href={`https://www.geeksforgeeks.org/?s=${encodeURIComponent(t)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-2.5 py-0.5 text-xs text-primary hover:bg-secondary/40"
                  >
                    {t} ↗
                  </a>
                ))}
                <a
                  href="https://neetcode.io/roadmap"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border px-2.5 py-0.5 text-xs text-primary hover:bg-secondary/40"
                >
                  NeetCode roadmap ↗
                </a>
              </div>
            </div>
          )}

          {sub && <SubmissionResult sub={sub} />}

          <ProblemLeaderboard slug={params.slug} />
        </CardContent>
      </Card>

      <EditorPane
        lang={lang}
        setLang={setLang}
        code={code}
        setCode={setCode}
        starter={problem.starterCode?.[lang] ?? ''}
        slug={params.slug}
        onSubmit={() => submit.mutate()}
        submitting={submit.isPending}
        sub={sub}
        canSubmit={!!token}
      />
    </div>
  );
}

// ---------- subcomponents ----------

function EditorPane({
  lang,
  setLang,
  code,
  setCode,
  starter,
  slug,
  onSubmit,
  submitting,
  sub,
  canSubmit,
}: {
  lang: (typeof LANGS)[number]['value'];
  setLang: (l: (typeof LANGS)[number]['value']) => void;
  code: string;
  setCode: (s: string) => void;
  starter: string;
  slug: string;
  onSubmit: () => void;
  submitting: boolean;
  sub: Submission | undefined;
  canSubmit: boolean;
}) {
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [showTerminal, setShowTerminal] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save to localStorage per slug+lang, debounced 600ms.
  const storageKey = `sv:draft:${slug}:${lang}`;

  // Restore draft when slug/lang changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(storageKey);
    if (stored) setCode(stored);
    else setCode('');
  }, [slug, lang, storageKey, setCode]);

  // Debounced save on code change.
  useEffect(() => {
    if (typeof window === 'undefined' || !code) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(storageKey, code);
      setSavedAt(Date.now());
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [code, storageKey]);

  const effectiveCode = code || starter;

  // Determine what to show in the terminal panel.
  const terminalLines: { type: 'info' | 'stdout' | 'stderr' | 'verdict'; text: string }[] = [];
  if (sub) {
    terminalLines.push({
      type: 'verdict',
      text: `verdict: ${sub.verdict}${
        sub.testsTotal != null ? ` (${sub.testsPassed ?? 0}/${sub.testsTotal} tests)` : ''
      }${sub.runtimeMs != null ? ` · ${sub.runtimeMs} ms` : ''}`,
    });
    if (sub.failedTest) {
      terminalLines.push({ type: 'info', text: `--- failed test ---` });
      terminalLines.push({ type: 'info', text: `input: ${sub.failedTest.input}` });
      terminalLines.push({ type: 'info', text: `expected: ${sub.failedTest.expectedOutput}` });
      terminalLines.push({
        type: 'stdout',
        text: `your stdout: ${sub.failedTest.gotStdout || '(empty)'}`,
      });
      if (sub.failedTest.stderr) {
        terminalLines.push({ type: 'stderr', text: `stderr: ${sub.failedTest.stderr}` });
      }
      if (sub.failedTest.compileOutput) {
        terminalLines.push({
          type: 'stderr',
          text: `compile: ${sub.failedTest.compileOutput}`,
        });
      }
    } else if (sub.verdict === 'AC') {
      terminalLines.push({ type: 'info', text: 'All tests passed ✓' });
    }
  } else {
    terminalLines.push({
      type: 'info',
      text: 'Hit "Run & submit" — output, errors, and test diffs will land here.',
    });
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 py-3">
        <div className="flex items-center gap-2">
          <select
            className="rounded border bg-background px-2 py-1 text-xs"
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value}
              </option>
            ))}
          </select>
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] hover:bg-secondary"
            title="Toggle editor theme"
          >
            {theme === 'vs-dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            {theme === 'vs-dark' ? 'Dark' : 'Light'}
          </button>
          <button
            onClick={() => setShowTerminal((s) => !s)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] hover:bg-secondary ${
              showTerminal ? 'bg-secondary' : ''
            }`}
            title="Toggle terminal panel"
          >
            <TerminalIcon className="h-3 w-3" /> Terminal
          </button>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Save className="h-3 w-3" /> saved
            </span>
          )}
        </div>
        <Button onClick={onSubmit} disabled={submitting || !canSubmit} size="sm">
          {submitting ? 'Submitting…' : 'Run & submit'}
        </Button>
      </CardHeader>
      <div
        className={showTerminal ? 'flex-1 min-h-0 grid grid-rows-[1fr_180px]' : 'flex-1 min-h-0'}
      >
        <div className="min-h-0">
          <MonacoEditor
            height="100%"
            language={LANGS.find((l) => l.value === lang)?.monaco}
            theme={theme}
            value={effectiveCode}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, comments: false, strings: false },
            }}
          />
        </div>
        {showTerminal && (
          <div
            className={`overflow-auto border-t font-mono text-[11px] leading-relaxed p-3 ${
              theme === 'vs-dark' ? 'bg-[#1e1e1e] text-zinc-300' : 'bg-white text-zinc-700'
            }`}
          >
            {terminalLines.map((l, i) => (
              <div
                key={i}
                className={
                  l.type === 'verdict'
                    ? sub?.verdict === 'AC'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : l.type === 'stderr'
                      ? 'text-rose-400'
                      : l.type === 'stdout'
                        ? theme === 'vs-dark'
                          ? 'text-zinc-100'
                          : 'text-zinc-900'
                        : theme === 'vs-dark'
                          ? 'text-zinc-500'
                          : 'text-zinc-500'
                }
              >
                <span className="text-zinc-600 select-none mr-2">›</span>
                {l.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function SubmissionResult({ sub }: { sub: Submission }) {
  const tone =
    sub.verdict === 'AC' ? 'success' : sub.verdict === 'PENDING' ? 'secondary' : 'warning';
  const ft = sub.failedTest;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Latest submission
          {sub.testsTotal != null && (
            <span className="text-xs font-normal text-muted-foreground">
              · {sub.testsPassed ?? 0}/{sub.testsTotal} tests
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant={tone}>{sub.verdict}</Badge>
          {sub.runtimeMs != null && (
            <span className="text-muted-foreground">{sub.runtimeMs} ms</span>
          )}
          {sub.memoryKb ? (
            <span className="text-muted-foreground">· {Math.round(sub.memoryKb / 1024)} MB</span>
          ) : null}
        </div>

        {ft && (
          <div className="rounded-md border bg-secondary/40 p-3 space-y-2 text-xs">
            <div className="font-medium text-foreground">
              Failed on test #{(sub.testsPassed ?? 0) + 1} · {ft.status}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Block label="Input" body={ft.input} />
              <Block label="Expected" body={ft.expectedOutput} />
              <Block label="Your stdout" body={ft.gotStdout || '(empty)'} tone="warning" />
              {ft.stderr && <Block label="stderr" body={ft.stderr} tone="warning" />}
              {ft.compileOutput && (
                <Block label="Compile output" body={ft.compileOutput} tone="warning" />
              )}
            </div>
          </div>
        )}

        {sub.verdict !== 'AC' && sub.verdict !== 'PENDING' && !ft && (
          <div className="rounded border border-amber-300/40 bg-amber-50/40 p-3 text-xs dark:bg-amber-900/10">
            <p className="font-medium">Code execution sandbox not running</p>
            <p className="mt-1 text-muted-foreground">
              Judge0 is down — start it with{' '}
              <code className="text-foreground">
                docker compose up -d judge0-db judge0-redis judge0-api judge0-worker
              </code>
              . AI feedback below is from code analysis only.
            </p>
          </div>
        )}
        {sub.aiFeedback && (
          <div className="rounded bg-secondary p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI review
              <span className="ml-auto text-muted-foreground">{sub.aiFeedback.rating}/10</span>
            </div>
            <Section label="Correctness" value={sub.aiFeedback.correctness} compact />
            <div className="grid gap-1 md:grid-cols-2">
              <Section label="Time" value={sub.aiFeedback.timeComplexity} compact />
              <Section label="Space" value={sub.aiFeedback.spaceComplexity} compact />
            </div>
            <Section label="Style" value={sub.aiFeedback.style} compact />
            {sub.aiFeedback.suggestions?.length > 0 && (
              <Bullets label="Suggestions" items={sub.aiFeedback.suggestions} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AiPanel({
  title,
  icon: Icon,
  children,
  onClose,
}: {
  title: string;
  icon: typeof Lightbulb;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          ×
        </button>
      </div>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

function Section({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div
        className={
          compact
            ? 'text-[10px] uppercase tracking-wider text-muted-foreground'
            : 'text-xs font-medium text-muted-foreground'
        }
      >
        {label}
      </div>
      <div className={compact ? 'text-xs' : 'text-sm'}>{value}</div>
    </div>
  );
}

function Block({ label, body, tone }: { label: string; body: string; tone?: 'warning' }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <pre
        className={`mt-0.5 whitespace-pre-wrap rounded px-2 py-1 font-mono ${
          tone === 'warning'
            ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
            : 'bg-background'
        }`}
      >
        {body}
      </pre>
    </div>
  );
}

function Bullets({
  label,
  items,
  icon: Icon,
  tone,
}: {
  label: string;
  items: string[];
  icon?: typeof AlertTriangle;
  tone?: 'warning';
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className={`h-3.5 w-3.5 ${tone === 'warning' ? 'text-amber-600' : ''}`} />}
        {label}
      </div>
      <ul className="mt-1 list-disc pl-5 text-sm space-y-0.5">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
