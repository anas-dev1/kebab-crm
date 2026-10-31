import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useStore } from '../data/store'
import { OPEN_STATUSES, STATUS, STATUS_ORDER } from '../lib/status'
import { ago, fmtDate, isOverdue, todayStr } from '../lib/dates'
import type { Prospect, Status } from '../lib/types'
import { Avatar, PageTitle } from '../components/ui'

function ProspectCard({ p }: { p: Prospect }) {
  const { profileOf, tasks } = useStore()
  const next = tasks
    .filter((t) => t.prospect_id === p.id && !t.done_at)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
  return (
    <Link to={`/prospects/${p.id}`} className="block rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-400">
      <p className="truncate font-semibold">{p.business_name}</p>
      <p className="truncate text-xs text-slate-500">{[p.city, p.niche].filter(Boolean).join(' · ') || '—'}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Avatar profile={profileOf(p.owner_id)} />
        {next ? (
          <span className={`truncate text-xs ${isOverdue(next.due_date) ? 'font-medium text-rose-600' : next.due_date === todayStr() ? 'font-medium text-orange-600' : 'text-slate-500'}`}>
            {next.title.split(' : ')[0]} · {fmtDate(next.due_date)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{ago(p.updated_at)}</span>
        )}
      </div>
    </Link>
  )
}

export function Pipeline() {
  const { prospects, profiles, me } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [niche, setNiche] = useState('')
  const [owner, setOwner] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const focus = params.get('status') as Status | null

  const niches = useMemo(() => Array.from(new Set(prospects.map((p) => p.niche).filter((n): n is string => !!n))).sort(), [prospects])

  const filtered = prospects.filter((p) => {
    if (q && !`${p.business_name} ${p.contact_name ?? ''} ${p.city ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
    if (niche && p.niche !== niche) return false
    if (owner && p.owner_id !== owner) return false
    return true
  })

  const columns = (showClosed ? STATUS_ORDER : OPEN_STATUSES).filter((s) => !focus || s === focus)
  const byStatus = (s: Status) => filtered.filter((p) => p.status === s).sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  return (
    <div>
      <PageTitle title="Pipeline" subtitle={`${filtered.length} prospect(s)`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input w-56 pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={niche} onChange={(e) => setNiche(e.target.value)}>
          <option value="">Toutes les niches</option>
          {niches.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Tout le monde</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id === me?.id ? 'Moi' : p.name}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Gagnés / perdus
        </label>
        {focus && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
            Voir toutes les colonnes
          </button>
        )}
      </div>

      {/* Desktop : kanban */}
      <div className="hidden gap-3 overflow-x-auto pb-4 md:flex">
        {columns.map((s) => {
          const items = byStatus(s)
          return (
            <div key={s} className="flex w-64 shrink-0 flex-col rounded-xl bg-slate-200/60 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS[s].dot}`} />
                  <span className="text-sm font-semibold">{STATUS[s].label}</span>
                </div>
                <span className="rounded-full bg-white px-2 text-xs font-medium text-slate-600">{items.length}</span>
              </div>
              <p className="mb-2 px-1 text-[11px] text-slate-500">{STATUS[s].hint}</p>
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <ProspectCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile : liste par statut */}
      <div className="space-y-3 md:hidden">
        {columns.map((s) => {
          const items = byStatus(s)
          if (items.length === 0) return null
          return (
            <details key={s} open className="card">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 font-semibold">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS[s].dot}`} />
                  {STATUS[s].label}
                </span>
                <span className="text-xs text-slate-500">{items.length}</span>
              </summary>
              <div className="flex flex-col gap-2 px-3 pb-3">
                {items.map((p) => (
                  <ProspectCard key={p.id} p={p} />
                ))}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
