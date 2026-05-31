import type { ResumeData } from './page';

// 3 print-friendly templates. All use plain HTML + Tailwind so the print
// stylesheet inherits cleanly. Padding is in mm to play nice with A4 export.

export function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] min-h-full font-sans">
      {/* Sidebar */}
      <aside className="bg-emerald-900 text-emerald-50 p-8">
        <h1 className="text-2xl font-bold leading-tight">{data.name}</h1>
        <div className="mt-1 text-sm text-emerald-200">{data.headline}</div>

        <Block title="Contact">
          {data.email && <Line>{data.email}</Line>}
          {data.phone && <Line>{data.phone}</Line>}
          {data.location && <Line>{data.location}</Line>}
        </Block>

        {data.links.length > 0 && (
          <Block title="Links">
            {data.links.map((l) => (
              <Line key={l.url}>
                {l.label}: <span className="opacity-80 break-all">{stripScheme(l.url)}</span>
              </Line>
            ))}
          </Block>
        )}

        <Block title="Education">
          <div className="text-sm font-semibold">{data.institution}</div>
          {data.graduationYear && <div className="text-xs">Class of {data.graduationYear}</div>}
          {data.cgpa != null && <div className="text-xs">CGPA: {data.cgpa.toFixed(2)}</div>}
        </Block>

        {data.skills.length > 0 && (
          <Block title="Skills">
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s) => (
                <span key={s} className="rounded bg-emerald-800/60 px-2 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </Block>
        )}
      </aside>

      {/* Main column */}
      <main className="p-8">
        {data.bio && (
          <Section title="About">
            <p className="text-sm leading-relaxed text-zinc-700">{data.bio}</p>
          </Section>
        )}

        {data.projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-3">
              {data.projects.map((p) => (
                <div key={p.title}>
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold">{p.title}</div>
                    {p.repoUrl && (
                      <div className="text-[10px] text-zinc-500 break-all">
                        {stripScheme(p.repoUrl)}
                      </div>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-zinc-600 mt-0.5">{p.description}</p>}
                  {p.techStack.length > 0 && (
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {p.techStack.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.certifications.length > 0 && (
          <Section title="Certifications">
            <ul className="text-sm space-y-1">
              {data.certifications.map((c, i) => (
                <li key={i}>
                  <strong>{c.courseName}</strong>
                  <span className="text-zinc-500"> — {c.issuer}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>
    </div>
  );
}

export function ClassicTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="p-10 font-serif text-zinc-900">
      <header className="border-b border-zinc-300 pb-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
        <div className="text-sm text-zinc-600 mt-1">{data.headline}</div>
        <div className="text-xs text-zinc-500 mt-1 flex flex-wrap justify-center gap-3">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.location && <span>· {data.location}</span>}
          {data.links.map((l) => (
            <span key={l.url}>· {stripScheme(l.url)}</span>
          ))}
        </div>
      </header>

      <ClassicSection title="Education">
        <div className="flex justify-between text-sm">
          <div>
            <strong>{data.institution}</strong>
            {data.cgpa != null && (
              <span className="text-zinc-600"> · CGPA {data.cgpa.toFixed(2)}</span>
            )}
          </div>
          {data.graduationYear && (
            <div className="text-zinc-600">Class of {data.graduationYear}</div>
          )}
        </div>
      </ClassicSection>

      {data.bio && (
        <ClassicSection title="Profile">
          <p className="text-sm leading-relaxed">{data.bio}</p>
        </ClassicSection>
      )}

      {data.skills.length > 0 && (
        <ClassicSection title="Skills">
          <p className="text-sm">{data.skills.join(' · ')}</p>
        </ClassicSection>
      )}

      {data.projects.length > 0 && (
        <ClassicSection title="Projects">
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.title} className="text-sm">
                <div className="flex justify-between">
                  <strong>{p.title}</strong>
                  {p.repoUrl && (
                    <span className="text-xs text-zinc-500">{stripScheme(p.repoUrl)}</span>
                  )}
                </div>
                {p.description && <p className="text-xs text-zinc-700 mt-0.5">{p.description}</p>}
                {p.techStack.length > 0 && (
                  <div className="text-[10px] text-zinc-500 italic">{p.techStack.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        </ClassicSection>
      )}

      {data.certifications.length > 0 && (
        <ClassicSection title="Certifications">
          <ul className="text-sm list-disc pl-5 space-y-0.5">
            {data.certifications.map((c, i) => (
              <li key={i}>
                {c.courseName} — <span className="text-zinc-600">{c.issuer}</span>
              </li>
            ))}
          </ul>
        </ClassicSection>
      )}
    </div>
  );
}

export function CompactTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="p-8 font-sans text-zinc-900 text-[12px]">
      <header className="flex justify-between items-end border-b-2 border-zinc-900 pb-2">
        <div>
          <h1 className="text-xl font-bold">{data.name}</h1>
          <div className="text-zinc-600">{data.headline}</div>
        </div>
        <div className="text-right text-[10px] text-zinc-600 space-y-0.5">
          {data.email && <div>{data.email}</div>}
          {data.phone && <div>{data.phone}</div>}
          {data.links.map((l) => (
            <div key={l.url}>{stripScheme(l.url)}</div>
          ))}
        </div>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-4">
        <aside className="col-span-1 space-y-3">
          <CompactBlock title="Education">
            <div>
              <strong>{data.institution}</strong>
            </div>
            {data.cgpa != null && <div>CGPA {data.cgpa.toFixed(2)}</div>}
            {data.graduationYear && <div>Class of {data.graduationYear}</div>}
            {data.location && <div className="text-zinc-500">{data.location}</div>}
          </CompactBlock>

          {data.skills.length > 0 && (
            <CompactBlock title="Skills">
              <ul className="list-disc pl-4 space-y-0.5">
                {data.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </CompactBlock>
          )}
        </aside>

        <main className="col-span-2 space-y-3">
          {data.bio && (
            <CompactBlock title="Summary">
              <p>{data.bio}</p>
            </CompactBlock>
          )}
          {data.projects.length > 0 && (
            <CompactBlock title="Projects">
              {data.projects.map((p) => (
                <div key={p.title} className="mb-1.5">
                  <div className="flex justify-between">
                    <strong>{p.title}</strong>
                    {p.repoUrl && (
                      <span className="text-[10px] text-zinc-500">{stripScheme(p.repoUrl)}</span>
                    )}
                  </div>
                  {p.description && <div>{p.description}</div>}
                  {p.techStack.length > 0 && (
                    <div className="text-[10px] text-zinc-500">{p.techStack.join(' · ')}</div>
                  )}
                </div>
              ))}
            </CompactBlock>
          )}
          {data.certifications.length > 0 && (
            <CompactBlock title="Certifications">
              {data.certifications.map((c, i) => (
                <div key={i}>
                  {c.courseName} — <span className="text-zinc-500">{c.issuer}</span>
                </div>
              ))}
            </CompactBlock>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- shared bits ----------

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-wider text-emerald-300 mb-1.5">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return <div className="text-xs">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClassicSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="text-sm font-bold uppercase tracking-widest border-b border-zinc-400 mb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CompactBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-0.5">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, '');
}
