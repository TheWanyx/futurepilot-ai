import { Clock, AlertOctagon, Wrench, ExternalLink, ShieldCheck } from 'lucide-react'
import type { Career } from '../../data/types'
import { SectionIntro, Tag } from '../ui'

export function RealityBrief({ career }: { career: Career }) {
  return (
    <div>
      <SectionIntro code="01" title="What this job actually is" blurb="Before the brochure version — here is the honest day-to-day, including the part nobody puts in the job ad." />

      <div className="card p-5 sm:p-6">
        <p className="font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
          “{career.oneLineReality}”
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={18} className="text-brand" />
            <h3 className="text-base font-semibold text-ink">A real day</h3>
          </div>
          <ul className="space-y-2.5">
            {career.typicalDay.map((d, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="mb-2 text-base font-semibold text-ink">How the work feels</h3>
            <p className="text-[15px] leading-relaxed text-ink-soft">{career.workStyle}</p>
          </div>

          <div className="rounded-2xl border border-caution/30 bg-caution-soft/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertOctagon size={18} className="text-caution" />
              <h3 className="text-base font-semibold text-ink">The part nobody tells you</h3>
            </div>
            <p className="text-[15px] leading-relaxed text-ink-soft">{career.boringHardPart}</p>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wrench size={18} className="text-brand" />
          <h3 className="text-base font-semibold text-ink">Tools you’d live in</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {career.keyTools.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-go" />
          {career.generated ? 'AI-generated profile' : 'Pay & outlook verified against'}
        </span>
        <a
          href={career.blsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
        >
          U.S. Bureau of Labor Statistics
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}
