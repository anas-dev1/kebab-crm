import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { CHANNELS, LOST_REASONS } from '../lib/status'
import { byChannel, byLostReason, byNiche, computeFunnel, pct } from '../lib/stats'
import { plusDays } from '../lib/dates'
import { PageTitle, Section } from '../components/ui'

export function Stats() {
  const { prospects, activities } = useStore()
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('30')
  const [niche, setNiche] = useState('')
  const [channel, setChannel] = useState('')

  const niches = useMemo(() => Array.from(new Set(prospects.map((p) => p.niche).filter((n): n is string => !!n))).sort(), [prospects])

  const filtered = prospects.filter((p) => {
    if (period !== 'all' && p.created_at.slice(0, 10) < plusDays(-Number(period))) return false
    if (niche && p.niche !== niche) return false
    if (channel && p.channel !== channel) return false
    return true
  })

  const f = computeFunnel(filtered, activities)
  const steps = [
    { label: 'Prospects', value: f.total, prev: f.total },
    { label: 'Contactés', value: f.contacted, prev: f.total },
    { label: 'Ont répondu', value: f.replied, prev: f.contacted },
    { label: 'Rendez-vous', value: f.meetings, prev: f.replied },
    { label: 'Devis envoyés', value: f.quotes, prev: f.meetings },
    { label: 'Vendus', value: f.won, prev: f.quotes },
  ]

  const channels = byChannel(filtered)
  const nichesMap = byNiche(filtered)
  const lost = byLostReason(filtered)

  return (
    <div className="space-y-5">
      <PageTitle title="Stats" subtitle="Ce qui vous dit quelle niche et quel canal garder." />

      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value as '30' | '90' | 'all')}>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
          <option value="all">Depuis le début</option>
        </select>
        <select className="input w-auto" value={niche} onChange={(e) => setNiche(e.target.value)}>
          <option value="">Toutes les niches</option>
          {niches.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">Tous les canaux</option>
          {Object.entries(CHANNELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <Section title="Entonnoir">
        <div className="space-y-2">
          {steps.map((s) => (
            <div key={s.label} className="grid grid-cols-[130px_1fr_60px_60px] items-center gap-3 text-sm">
              <span className="text-slate-600">{s.label}</span>
              <div className="h-6 overflow-hidden rounded bg-slate-100">
                <div className="h-full rounded bg-orange-500" style={{ width: `${pct(s.value, f.total)}%` }} />
              </div>
              <span className="text-right font-semibold">{s.value}</span>
              <span className="text-right text-xs text-slate-400" title="Par rapport à l'étape précédente">
                {pct(s.value, s.prev)} %
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Taux de vente global : <span className="font-semibold text-slate-700">{pct(f.won, f.contacted)} %</span> des contactés.
        </p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Par canal">
          <FunnelTable rows={Array.from(channels.entries()).map(([k, ps]) => ({ label: CHANNELS[k], ps }))} activities={activities} />
        </Section>
        <Section title="Par niche">
          <FunnelTable rows={Array.from(nichesMap.entries()).map(([k, ps]) => ({ label: k, ps }))} activities={activities} />
        </Section>
      </div>

      <Section title="Motifs de perte">
        {lost.size === 0 ? (
          <p className="text-sm text-slate-500">Aucun prospect perdu sur la période.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {Array.from(lost.entries()).map(([k, ps]) => (
              <li key={k} className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-800 ring-1 ring-rose-200">
                {LOST_REASONS[k]} · <span className="font-semibold">{ps.length}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function FunnelTable({ rows, activities }: { rows: { label: string; ps: ReturnType<typeof byNiche> extends Map<string, infer V> ? V : never }[]; activities: Parameters<typeof computeFunnel>[1] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Pas encore de données.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
          <th className="py-1 font-medium">Segment</th>
          <th className="py-1 text-right font-medium">Contactés</th>
          <th className="py-1 text-right font-medium">Répondu</th>
          <th className="py-1 text-right font-medium">RDV</th>
          <th className="py-1 text-right font-medium">Vendus</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const f = computeFunnel(r.ps, activities)
          return (
            <tr key={r.label} className="border-t border-slate-100">
              <td className="py-1.5 font-medium">{r.label}</td>
              <td className="py-1.5 text-right">{f.contacted}</td>
              <td className="py-1.5 text-right">
                {f.replied} <span className="text-xs text-slate-400">({pct(f.replied, f.contacted)} %)</span>
              </td>
              <td className="py-1.5 text-right">{f.meetings}</td>
              <td className="py-1.5 text-right font-semibold">{f.won}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
