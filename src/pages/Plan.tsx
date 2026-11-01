import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Check, Shuffle } from 'lucide-react'
import { useStore } from '../data/store'
import { fmtDate, fmtDayShort, isWeekendDay, nextPlanningDay, plusDays } from '../lib/dates'
import { distribute, unplanned } from '../lib/plan'
import { useSettings } from '../lib/settings'
import { Avatar, Empty, Field, PageTitle, Section, StatusBadge } from '../components/ui'

export function Plan() {
  const { me, profiles, prospects, tasks, profileOf, planVideos } = useStore()
  const settings = useSettings()
  const workDaysOnly = settings.workDays === 5
  const [assignee, setAssignee] = useState(me?.id ?? '')
  const [day, setDay] = useState(() => nextPlanningDay(workDaysOnly))
  const [perDay, setPerDay] = useState(settings.videosPerDay)
  const [start, setStart] = useState(() => nextPlanningDay(workDaysOnly))
  const [skipWeekend, setSkipWeekend] = useState(workDaysOnly)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  if (!me) return null

  const list = unplanned(prospects, tasks)
  const chosen = list.filter((p) => selected.has(p.id))
  const targets = chosen.length > 0 ? chosen : list
  const who = profileOf(assignee)

  // Vidéos déjà prévues par jour pour la personne choisie.
  const plannedOn = (d: string) => tasks.filter((t) => t.type === 'video' && !t.done_at && t.assigned_to === assignee && t.due_date === d).length
  // Les 14 prochains jours, pour choisir un jour en voyant ce qui est déjà prévu.
  const horizon = Array.from({ length: 14 }, (_, i) => plusDays(i))

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleAll = () => setSelected(selected.size === list.length ? new Set() : new Set(list.map((p) => p.id)))

  async function run(assignments: { prospectId: string; due: string }[]) {
    if (assignments.length === 0 || busy) return
    setBusy(true)
    try {
      await planVideos(assignments, assignee)
      const days = Array.from(new Set(assignments.map((a) => a.due))).sort()
      setDone(
        `${assignments.length} vidéo(s) planifiée(s) pour ${who?.name ?? '?'}${days.length === 1 ? ` le ${fmtDate(days[0])}` : ` du ${fmtDate(days[0])} au ${fmtDate(days[days.length - 1])}`}`,
      )
      setSelected(new Set())
    } finally {
      setBusy(false)
    }
  }

  const preview = distribute(
    targets.map((p) => p.id),
    { perDay, start, workDaysOnly: skipWeekend, existing: plannedOn },
  )
  const previewDays = Array.from(new Set(preview.map((a) => a.due))).sort()

  return (
    <div className="space-y-5">
      <PageTitle
        title="Planifier"
        subtitle={`${list.length} prospect(s) sans vidéo prévue`}
        right={
          <Link to="/semaine" className="btn btn-ghost btn-sm">
            Voir la semaine
          </Link>
        }
      />

      {done && (
        <div className="card flex items-center gap-3 border-l-4 border-l-emerald-500 p-4 text-sm">
          <Check size={18} className="text-emerald-600" />
          <span className="flex-1">{done}</span>
          <Link to="/semaine" className="btn btn-ghost btn-sm">
            Semaine
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Planifier la sélection">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pour">
              <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jour">
              <input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {horizon.map((d) => {
              const n = plannedOn(d)
              const we = isWeekendDay(d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`rounded-md px-2 py-1 text-xs capitalize ring-1 transition ${
                    day === d ? 'bg-slate-900 text-white ring-slate-900' : we ? 'bg-slate-50 text-slate-400 ring-slate-200' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-400'
                  }`}
                  title={`${n} vidéo(s) déjà prévue(s)`}
                >
                  {fmtDayShort(d)}
                  <span className={`ml-1 font-semibold ${n >= perDay ? 'text-rose-500' : ''}`}>{n}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4"
            disabled={chosen.length === 0 || !day || busy}
            onClick={() => void run(chosen.map((p) => ({ prospectId: p.id, due: day })))}
          >
            <CalendarCheck size={16} /> Planifier {chosen.length > 0 ? `${chosen.length} prospect(s)` : 'la sélection'} le {day ? fmtDate(day) : '…'}
          </button>
          <p className="mt-2 text-xs text-slate-400">Coche des prospects dans la liste, choisis un jour, et chaque prospect reçoit une tâche « Vidéo + envoi » ce jour-là.</p>
        </Section>

        <Section title="Répartir automatiquement">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Par jour">
              <input className="input" type="number" min={1} max={100} value={perDay} onChange={(e) => setPerDay(Math.max(1, Number(e.target.value) || 1))} />
            </Field>
            <Field label="À partir du">
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skipWeekend} onChange={(e) => setSkipWeekend(e.target.checked)} />
            Jours ouvrés seulement (pas le week-end)
          </label>
          <button type="button" className="btn btn-accent mt-4" disabled={preview.length === 0 || !start || busy} onClick={() => void run(preview)}>
            <Shuffle size={16} /> Répartir {targets.length} prospect(s){chosen.length > 0 ? ' sélectionné(s)' : ''}
          </button>
          {preview.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {previewDays.length} jour(s), du {fmtDate(previewDays[0])} au {fmtDate(previewDays[previewDays.length - 1])}, en complétant les jours déjà entamés jusqu'à {perDay} par jour.
            </p>
          )}
          {preview.length === 0 && list.length > 0 && <p className="mt-2 text-xs text-slate-400">Rien à répartir.</p>}
        </Section>
      </div>

      <Section
        title={`Sans vidéo prévue (${list.length})`}
        right={
          list.length > 0 ? (
            <button type="button" className="text-xs text-slate-500 hover:text-slate-900" onClick={toggleAll}>
              {selected.size === list.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          ) : null
        }
      >
        {list.length === 0 ? (
          <Empty title="Tout est planifié." text="Chaque prospect ouvert a déjà une vidéo prévue, ou a déjà été contacté.">
            <Link to="/prospects/nouveau" className="btn btn-accent">
              Ajouter un prospect
            </Link>
          </Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <input type="checkbox" className="h-4 w-4" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Sélectionner ${p.business_name}`} />
                <div className="min-w-0 flex-1">
                  <Link to={`/prospects/${p.id}`} className="block truncate font-medium hover:underline">
                    {p.business_name}
                  </Link>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <StatusBadge status={p.status} />
                    {[p.city, p.niche].filter(Boolean).join(' · ')}
                    <span className="text-slate-400">ajouté le {fmtDate(p.created_at)}</span>
                  </p>
                </div>
                <Avatar profile={profileOf(p.created_by)} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
