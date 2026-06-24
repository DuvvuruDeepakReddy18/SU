'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Bot, Send, Sparkles, RotateCcw, CheckCircle2 } from 'lucide-react';

type UserSkill = { id: string; skill: { id: string; name: string } };
type StartRes = {
  attemptId: string;
  skillName: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
};
type Area = { area: string; score: number; note: string };
type Result = { score: number; passed: boolean; areas: Area[]; feedback: string };
type AnswerRes =
  | { completed: false; question: string; questionNumber: number; totalQuestions: number }
  | { completed: true; result: Result };
type PastAttempt = {
  id: string;
  skillName: string | null;
  status: string;
  score: number | null;
  createdAt: string;
};

export default function InterviewPrepPage() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const [skillId, setSkillId] = useState('');
  const [topic, setTopic] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [transcript, setTranscript] = useState<{ q: string; a: string }[]>([]);
  const [question, setQuestion] = useState('');
  const [qNum, setQNum] = useState(0);
  const [qTotal, setQTotal] = useState(5);
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const { data: skills } = useQuery({
    enabled: !!token,
    queryKey: ['skills.me'],
    queryFn: () => api<UserSkill[]>('/skills/me', { token }),
  });
  const { data: past } = useQuery({
    enabled: !!token,
    queryKey: ['ai-screen.me'],
    queryFn: () => api<PastAttempt[]>('/ai-screen/me', { token }),
  });

  const start = useMutation({
    mutationFn: () =>
      api<StartRes>('/ai-screen/start', {
        method: 'POST',
        token,
        body: JSON.stringify(skillId ? { skillId } : { topic: topic.trim() }),
      }),
    onSuccess: (r) => {
      setAttemptId(r.attemptId);
      setSkillName(r.skillName);
      setQuestion(r.question);
      setQNum(r.questionNumber);
      setQTotal(r.totalQuestions);
      setTranscript([]);
      setResult(null);
      setDraft('');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const answer = useMutation({
    mutationFn: () =>
      api<AnswerRes>(`/ai-screen/${attemptId}/answer`, {
        method: 'POST',
        token,
        body: JSON.stringify({ answer: draft.trim() }),
      }),
    onSuccess: (r) => {
      setTranscript((t) => [...t, { q: question, a: draft.trim() }]);
      setDraft('');
      if (r.completed) {
        setResult(r.result);
        setQuestion('');
        qc.invalidateQueries({ queryKey: ['ai-screen.me'] });
      } else {
        setQuestion(r.question);
        setQNum(r.questionNumber);
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function reset() {
    setAttemptId('');
    setQuestion('');
    setResult(null);
    setTranscript([]);
    setDraft('');
    setSkillId('');
    setTopic('');
  }

  const interviewing = !!attemptId && !result;
  const canStart = (!!skillId || topic.trim().length >= 2) && !start.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Bot className="h-6 w-6 text-primary" /> AI mock interview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A strict, adaptive practice interview. Pick a skill or topic, answer {qTotal} questions,
          and get a score with per-area feedback. Free, and great prep before an expert L4
          interview.
        </p>
      </div>

      {/* Start */}
      {!attemptId && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a mock interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Pick a skill</div>
              <select
                value={skillId}
                onChange={(e) => {
                  setSkillId(e.target.value);
                  if (e.target.value) setTopic('');
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Select a skill…</option>
                {skills?.map((s) => (
                  <option key={s.id} value={s.skill.id}>
                    {s.skill.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center text-xs text-muted-foreground">or</div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Type a topic</div>
              <Input
                placeholder="e.g. System Design, SQL, Behavioural"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (e.target.value) setSkillId('');
                }}
                maxLength={80}
              />
            </div>
            <Button disabled={!canStart} onClick={() => start.mutate()}>
              <Sparkles className="h-4 w-4" /> {start.isPending ? 'Starting…' : 'Start interview'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Interview */}
      {interviewing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{skillName}</CardTitle>
              <span className="text-xs text-muted-foreground">
                Question {qNum} of {qTotal}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {transcript.length > 0 && (
              <div className="space-y-3 rounded-md border bg-secondary/20 p-3">
                {transcript.map((t, i) => (
                  <div key={i} className="text-xs">
                    <div className="font-medium text-foreground">
                      Q{i + 1}. {t.q}
                    </div>
                    <div className="mt-0.5 text-muted-foreground">{t.a}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-md bg-primary/5 p-3 text-sm font-medium">{question}</div>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Type your answer…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                disabled={draft.trim().length < 1 || answer.isPending}
                onClick={() => answer.mutate()}
              >
                {answer.isPending ? 'Thinking…' : qNum >= qTotal ? 'Submit & finish' : 'Submit'}
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {skillName} · your score
              </div>
              <div
                className={`mt-1 text-5xl font-semibold ${
                  result.passed ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {result.score}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="mt-1 text-sm font-medium">
                {result.passed ? '✓ Strong — interview-ready' : 'Keep practising'}
              </div>
            </div>

            {result.feedback && (
              <p className="rounded-md border bg-secondary/20 p-3 text-sm text-muted-foreground">
                {result.feedback}
              </p>
            )}

            {result.areas.length > 0 && (
              <div className="space-y-2">
                {result.areas.map((a, i) => (
                  <div key={i} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{a.area}</span>
                      <span className="text-muted-foreground">{a.score}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${a.score}%` }}
                      />
                    </div>
                    {a.note && <div className="mt-1 text-xs text-muted-foreground">{a.note}</div>}
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Start another
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past attempts */}
      {!interviewing && (past?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past mock interviews</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {past?.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <span className="font-medium">{a.skillName ?? 'Interview'}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {a.status === 'completed' && a.score != null ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {a.score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">incomplete</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
