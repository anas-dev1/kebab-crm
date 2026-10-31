import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Check, ExternalLink, Phone, Video, PencilRuler, CalendarCheck, Repeat, CircleDot } from 'lucide-react'
import { useStore } from '../data/store'
import { fmtDate, fmtDateLong, isOverdue, isToday, plusDays, todayStr } from '../lib/dates'
import { STATUS } from '../lib/status'
import type { Task, TaskType } from '../lib/types'
import { Empty, PageTitle, Section, StatusBadge } from '../components/ui'

const TASK_ICON: Record<TaskType, typeof Check> = {
  relance: Repeat, maquette: PencilRuler, video: Video, appel: Phone, rdv: CalendarCheck, autre: CircleDot,
}

function TaskRow({ task, onDone }: { task: Task; onDone: () => void }) {
  const { prospects } = useStore()
  const p = prospects.find((x) => x.id === task.prospect_id)
  const Icon = TASK_ICON[task.type]
  const late = isOverdue(task.due_date)
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${late ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{task.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {p && <StatusBadge status={p.status} />}
          {p?.city && <span>{p.city}</span>}
          <span className={late ? 'font-medium text-rose-600' : ''}>
            {late ? `En retard (${fmtDate(task.due_date)})` : isToday(task.due_date) ? "Aujourd'hui" : fmtDate(task.due_date)}
          </span>
        </p>
      </div>
      {p && (
        <Link to={`/prospects/${p.id}`} className="btn btn-ghost btn-sm" title="Ouvrir la fiche">
          <ExternalLink size={14} />
        </Link>
      )}
      <button type="button" className="btn btn-primary btn-sm" onClick={onDone} title="Marquer comme fait">
        <Check size={14} /> Fait
      </button>
    </li>
  )
}

export function Today() {
  const { me, tasks, prospects, profiles, completeTask } = useStore()
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const today = todayStr()
  if (!me) return null

  const mine = tasks.filter((t) => t.assigned_to === me.id && !t.done_at).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const due = mine.filter((t) => t.due_date <= today)
  const upcoming = mine.filter((t) => t.due_date > today && t.due_date <= plusDays(7))
  const other = profiles.find((p) => p.id !== me.id)

  const open = prospects.filter((p) => p.status !== 'gagne' && p.status !== 'perdu')
  const count = (...s: (typeof open)[number]['status'][]) => open.filter((p) => s.includes(p.status)).length
  const kpis = [
    { label: 'À qualifier', value: count('nouveau'), to: '/pipeline?status=nouveau' },
    { label: 'Maquettes à faire', value: count('maquette_demandee', 'maquette_en_cours'), to: '/pipeline?status=maquette_demandee' },
    { label: 'Vidéos à faire', value: count('maquette_prete'), to: '/pipeline?status=maquette_prete' },
    { label: 'En attente de réponse', value: count('contacte', 'en_attente'), to: '/pipeline?status=contacte' },
    { label: 'RDV / devis', value: count('rdv', 'devis_envoye'), to: '/pipeline?status=rdv' },
  ]
  const atOther = other ? open.filter((p) => p.owner_id === other.id).length : 0

  return (
    <div className="space-y-5">
      <PageTitle
        title={`Bonjour ${me.name}`}
        subtitle={fmtDateLong(today)}
        right={
          notifPerm === 'default' ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void Notification.requestPermission().then((p) => setNotifPerm(p))}
            >
              <BellRing size={16} /> Activer les notifications du navigateur
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="card p-4 transition hover:ring-slate-400">
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </Link>
        ))}
      </div>

      <Section title={`À faire aujourd'hui (${due.length})`}>
        {due.length === 0 ? (
          <Empty title="Rien en retard, rien pour aujourd'hui." text={other ? `${atOther} prospect(s) sont chez ${other.name}.` : undefined} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {due.map((t) => (
              <TaskRow key={t.id} task={t} onDone={() => void completeTask(t)} />
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Les 7 prochains jours (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Rien de prévu.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((t) => (
              <TaskRow key={t.id} task={t} onDone={() => void completeTask(t)} />
            ))}
          </ul>
        )}
      </Section>

      {other && (
        <Section title={`Chez ${other.name} (${atOther})`}>
          {atOther === 0 ? (
            <p className="text-sm text-slate-500">Rien en cours de son côté.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {open
                .filter((p) => p.owner_id === other.id)
                .map((p) => (
                  <li key={p.id}>
                    <Link to={`/prospects/${p.id}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-white">
                      <span className={`h-2 w-2 rounded-full ${STATUS[p.status].dot}`} />
                      {p.business_name}
                      <span className="text-xs text-slate-400">{STATUS[p.status].label}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  )
}
