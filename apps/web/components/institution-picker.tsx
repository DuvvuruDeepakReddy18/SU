'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Building2, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export type Institution = {
  id: string;
  name: string;
  shortName: string | null;
  category: string | null;
  nirfRank: number | null;
  state: string | null;
  city: string | null;
  verified: boolean;
  domain: string | null;
};

type Props = {
  value: Institution | null;
  onChange: (inst: Institution | null) => void;
  required?: boolean;
};

const CATEGORIES: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'IIT / NIT / IIIT', value: 'engineering' },
  { label: 'IIM', value: 'management' },
  { label: 'NLU / Law', value: 'law' },
  { label: 'IISER / Science', value: 'science' },
  { label: 'Commerce', value: 'commerce' },
  { label: 'DU / Arts', value: 'arts' },
  { label: 'Medical', value: 'medical' },
  { label: 'Other', value: 'other' },
];

export function InstitutionPicker({ value, onChange, required }: Props) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        params.set('limit', '20');
        const data = await api<Institution[]>(`/institutions/search?${params.toString()}`);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [q, category, open]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const displayValue = useMemo(() => {
    if (value) return value.shortName ? `${value.name} (${value.shortName})` : value.name;
    return '';
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-sm font-medium">
        Institution {required && <span className="text-destructive">*</span>}
      </label>

      {value ? (
        <div className="mt-1 flex items-center justify-between rounded-md border border-input bg-secondary/30 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{displayValue}</div>
              {(value.city || value.state) && (
                <div className="text-xs text-muted-foreground truncate">
                  {[value.city, value.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(true);
            }}
            className="text-xs text-primary hover:underline shrink-0 ml-3"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your college… (e.g. IIM Sambalpur, SRCC, IIT Delhi)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              className="pl-8"
            />
          </div>

          {open && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-input bg-popover shadow-lg">
              {/* Category chips */}
              <div className="flex flex-wrap gap-1 border-b p-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs transition',
                      category === c.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Results — overscroll-contain keeps the mouse wheel scrolling
                  this list instead of bleeding through to the page behind. */}
              <div className="max-h-72 overflow-y-auto overscroll-contain">
                {loading && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">Searching…</div>
                )}
                {!loading && results.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No matches.{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setShowAddForm(true)}
                    >
                      Add your college →
                    </button>
                  </div>
                )}
                {!loading &&
                  results.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        onChange(inst);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-secondary/40 border-b last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {inst.name}
                            {inst.shortName && (
                              <span className="text-xs text-muted-foreground ml-1.5">
                                ({inst.shortName})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {[inst.city, inst.state].filter(Boolean).join(', ')}
                            {inst.nirfRank && ` · NIRF #${inst.nirfRank}`}
                          </div>
                        </div>
                        {inst.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
              </div>

              {/* Always-visible "add new" footer */}
              <div className="border-t p-2">
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Don&apos;t see your college? Add it
                  </button>
                ) : (
                  <AddInstitutionForm
                    initialName={q}
                    onAdded={(inst) => {
                      onChange(inst);
                      setOpen(false);
                      setShowAddForm(false);
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddInstitutionForm({
  initialName,
  onAdded,
  onCancel,
}: {
  initialName: string;
  onAdded: (inst: Institution) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('other');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const inst = await api<Institution>('/institutions/suggest', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || undefined,
          category,
          state: state.trim() || undefined,
        }),
      });
      onAdded(inst);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="text-xs font-medium">Add your college</div>
      <Input
        placeholder="Full college name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Email domain (optional)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="engineering">Engineering</option>
          <option value="management">Management</option>
          <option value="law">Law</option>
          <option value="science">Science</option>
          <option value="commerce">Commerce</option>
          <option value="arts">Arts / Humanities</option>
          <option value="medical">Medical</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
      {error && <div className="text-xs text-destructive">{error}</div>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting || name.trim().length < 4}>
          {submitting ? 'Adding…' : 'Add college'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Will appear as &quot;Pending verification&quot; until our team reviews it.
      </div>
    </form>
  );
}
