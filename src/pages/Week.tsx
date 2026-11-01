import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react'
import { useStore } from '../data/store'
import { dateOf, fmtDateLong, fmtDayShort, fmtWeekRange, todayStr, weekDays, weekStartStr } from '../lib/dates'
import { unplanned } from '../lib/plan'
import { useSettings, weeklyGoals } from '../lib/settings'
import { notableEvents, summarize, type NotableEvent, type PeriodSummary } from '../lib/week'
import type { Profile, Task } from '../lib/types'
import { Empty, PageTitle, Section } from '../components/ui'
import { EVENT_COLOR, EVENT_ICON, EventRow, TASK_ICON, TaskRow } from '../components/rows'

type Who = 'me' | 'other' | 'all'

const COLS: { key: keyof PeriodSummary; label: string }[] = [
  { key: 'done', label: 'Tâches faites' },
  { key: 'planned', label: 'Prévues' },
  { key: 'prospects', label: 'Prospects' },
  { key: 'videos', label: 'Vidéos' },
  { key: 'responses', label: 'Réponses' },
  { key: 'meetings', label: 'RDV' },
  { key: 'won', label: 'Gagnés' },
]

function Gauge({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  const ok = value >= goal
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={ok ? 'font-semibold text-emerald-700' : 'text-slate-500'}>
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DayCell({
  day, todo, done, events, selected, onSelect, onDone,
}: {
  day: string
  todo: Task[]
  done: Task[]
  events: NotableEvent[]
  selected: boolean
  onSelect: () => void
  onDone: (t: Task) => void
}) {
  const { prospects } = useStore()
  const nameOf = (id: string) => prospects.find((p) => p.id === id)?.business_name ?? '…'
  const today = day === todayStr()
  const past = day < todayStr()
  const empty = todo.length + done.length + events.length === 0
  return (
    <div className={`flex flex-col rounded-xl ring-1 md:min-h-28 ${selected ? 'bg-white ring-slate-900' : today ? 'bg-orange-50/60 ring-orange-300' : 'bg-white ring-slate-200'}`}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex items-center justify-between rounded-t-xl px-2.5 py-1.5 text-left text-xs font-semibold capitalize ${today ? 'text-orange-700' : past ? 'text-slate-400' : 'text-slate-600'} hover:bg-slate-50`}
      >
        {fmtDayShort(day)}
        {todo.length > 0 && <span className="rounded-full bg-slate-900 px-1.5 text-[10px] text-white">{todo.length}</span>}
      </button>
      <ul className="flex-1 space-y-1 px-1.5 pb-1.5 text-xs">
        {todo.map((t) => {
          const Icon = TASK_ICON[t.type]
          const late = past && !t.done_at
          return (
            <li key={t.id} className={`group flex items-center gap-1 rounded-md px-1 py-0.5 ${late ? 'bg-rose-50 text-rose-700' : 'bg-slate-50'}`}>
              <Icon size={12} className="shrink-0" />
              <Link to={`/prospects/${t.prospect_id}`} className="min-w-0 flex-1 truncate hover:underline" title={t.title}>
                {nameOf(t.prospect_id)}
              </Link>
              <button type="button" onClick={() => onDone(t)} className="rounded p-0.5 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700" title="Marquer comme fait">
                <Check size={12} />
              </button>
            </li>
          )
        })}
        {done.map((t) => {
          const Icon = TASK_ICON[t.type]
          return (
            <li key={t.id} className="flex items-center gap-1 px-1 py-0.5 text-slate-400">
              <Icon size={12} className="shrink-0" />
              <Link to={`/prospects/${t.prospect_id}`} className="min-w-0 flex-1 truncate line-through hover:underline" title={t.title}>
                {nameOf(t.prospect_id)}
              </Link>
              <Check size={12} className="shrink-0 text-emerald-500" />
            </li>
          )
        })}
        {events.map((e) => {
          const Icon = EVENT_ICON[e.kind]
          return (
            <li key={e.id} className={`flex items-center gap-1 rounded-md px-1 py-0.5 ${EVENT_COLOR[e.kind]}`} title={`${e.label} · ${nameOf(e.prospect_id)}`}>
              <Icon size={12} className="shrink-0" />
              <Link to={`/prospects/${e.prospect_id}`} className="min-w-0 flex-1 truncate hover:underline">
                {nameOf(e.prospect_id)}
              </Link>
            </li>
          )
        })}
        {empty && <li className="px-1 py-0.5 text-slate-300">—</li>}
      </ul>
    </div>
  )
}

export function Week() {
  const { me, profiles, tasks, prospects, activities, completeTask, moveTask } = useStore()
  const goals = weeklyGoals(useSettings())
  const [offset, setOffset] = useState(0)
  const [who, setWho] = useState<Who>('me')
  const [selected, setSelected] = useState<string | null>(todayStr())
  const other: Profile | undefined = profiles.find((p) => p.id !== me?.id)

  const start = weekStartStr(offset)
  const days = weekDays(start)
  const end = days[6]
  const today = todayStr()

  const userId = who === 'all' ? null : who === 'me' ? (me?.id ?? null) : (other?.id ?? null)
  const seesTask = (t: Task) => userId === null || t.assigned_to === userId
  const seesEvent = (e: NotableEvent) => userId === null || e.user_id === userId

  const events = useMemo(() => notableEvents(activities), [activities])
  const overdue = tasks.filter((t) => seesTask(t) && !t.done_at && t.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date))

  const byDay = (day: string) => ({
    todo: tasks.filter((t) => seesTask(t) && !t.done_at && t.due_date === day).sort((a, b) => a.title.localeCompare(b.title)),
    done: tasks.filter((t) => seesTask(t) && t.done_at && dateOf(t.done_at) === day).sort((a, b) => a.done_at!.localeCompare(b.done_at!)),
    events: events.filter((e) => seesEvent(e) && e.day === day),
  })

  const data = { tasks, prospects, activities }
  const rows = [...profiles.map((p) => ({ label: p.name, s: summarize(data, start, end, p.id) })), { label: 'Équipe', s: summarize(data, start, end, null) }]
  const team = rows[rows.length - 1].s
  const weekTodo = tasks.filter((t) => seesTask(t) && !t.done_at && t.due_date >= start && t.due_date <= end).length
  const toPlan = unplanned(prospects, tasks).length

  if (!me) return null
  const move = (t: Task) => (due: string) => void moveTask(t, due)
  const sel = selected && days.includes(selected) ? byDay(selected) : null
  const whoBtn = (k: Who, label: string) => (
    <button
      type="button"
      onClick={() => setWho(k)}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${who === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-5">
      <PageTitle
        title="Semaine"
        subtitle={`${fmtWeekRange(start)} · ${weekTodo} tâche(s) à faire`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/planifier" className={`btn btn-sm ${toPlan > 0 ? 'btn-accent' : 'btn-ghost'}`} title="Répartir les prospects sans vidéo prévue">
              <ListChecks size={14} /> Planifier{toPlan > 0 ? ` (${toPlan})` : ''}
            </Link>
            <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
              {whoBtn('me', me.name)}
              {other && whoBtn('other', other.name)}
              {whoBtn('all', 'Les deux')}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffset((o) => o - 1)} title="Semaine précédente">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOffset(0); setSelected(today) }} disabled={offset === 0}>
                Cette semaine
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffset((o) => o + 1)} title="Semaine suivante">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      {overdue.length > 0 && (
        <div className="card border-l-4 border-l-rose-500 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} /> En retard ({overdue.length})
          </p>
          <ul className="divide-y divide-slate-100">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} onDone={() => void completeTask(t)} onMove={move(t)} />
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((d) => {
          const { todo, done, events: evs } = byDay(d)
          return (
            <DayCell key={d} day={d} todo={todo} done={done} events={evs} selected={selected === d} onSelect={() => setSelected(d)} onDone={(t) => void completeTask(t)} />
          )
        })}
      </div>

      {selected && sel && (
        <Section title={fmtDateLong(selected)} right={selected === today ? <span className="badge bg-orange-100 text-orange-800">Aujourd'hui</span> : null}>
          {sel.todo.length + sel.done.length + sel.events.length === 0 ? (
            <Empty title="Rien ce jour-là." />
          ) : (
            <div className="space-y-4">
              {sel.todo.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">À faire ({sel.todo.length})</p>
                  <ul className="divide-y divide-slate-100">
                    {sel.todo.map((t) => (
                      <TaskRow key={t.id} task={t} onDone={() => void completeTask(t)} onMove={move(t)} />
                    ))}
                  </ul>
                </div>
              )}
              {sel.done.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Fait ({sel.done.length})</p>
                  <ul className="divide-y divide-slate-100">
                    {sel.done.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </ul>
                </div>
              )}
              {sel.events.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Événements ({sel.events.length})</p>
                  <ul className="divide-y divide-slate-100">
                    {sel.events.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <Section title="Bilan de la semaine">
        <div className="grid gap-4 sm:grid-cols-2">
          <Gauge label="Prospects ajoutés" value={team.prospects} goal={goals.prospects} />
          <Gauge label="Vidéos envoyées" value={team.videos} goal={goals.videos} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Qui</th>
                {COLS.map((c) => (
                  <th key={c.key} className="px-2 py-2 text-right font-semibold">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={`border-t border-slate-100 ${i === rows.length - 1 ? 'font-semibold' : ''}`}>
                  <td className="py-2 pr-3">{r.label}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-2 py-2 text-right tabular-nums">{r.s[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
