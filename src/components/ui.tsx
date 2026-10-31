import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { ROLE_LABEL, STATUS } from '../lib/status'
import type { Profile, Status } from '../lib/types'

export function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  const s = STATUS[status]
  return <span className={`badge ${s.color} ${className}`}>{s.label}</span>
}

export function Avatar({ profile, size = 'sm' }: { profile?: Profile; size?: 'sm' | 'md' }) {
  const color = profile?.role === 'dev' ? 'bg-violet-600' : 'bg-orange-500'
  const dim = size === 'md' ? 'h-9 w-9 text-sm' : 'h-6 w-6 text-[11px]'
  return (
    <span
      title={profile ? `${profile.name} (${ROLE_LABEL[profile.role]})` : 'Non assigné'}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dim} ${profile ? color : 'bg-slate-300'}`}
    >
      {profile?.name?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export function Section({ title, children, right, className = '' }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
