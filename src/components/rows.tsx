import { Link } from 'react-router-dom'
import {
  CalendarCheck, Check, CircleDot, ExternalLink, FileText, MessageCircle, PencilRuler, Phone, Repeat, Trophy, Video, XCircle,
} from 'lucide-react'
import { useStore } from '../data/store'
import { dateOf, fmtDate, fmtTime, isOverdue, isToday } from '../lib/dates'
import type { Task, TaskType } from '../lib/types'
import type { EventKind, NotableEvent } from '../lib/week'
import { Avatar, StatusBadge } from './ui'

export const TASK_ICON: Record<TaskType, typeof Check> = {
  relance: Repeat, maquette: PencilRuler, video: Video, appel: Phone, rdv: CalendarCheck, autre: CircleDot,
}

export const EVENT_ICON: Record<EventKind, typeof Check> = {
  video: Video, reponse: MessageCircle, rdv: CalendarCheck, maquette: PencilRuler, devis: FileText, gagne: Trophy, perdu: XCircle,
}

export const EVENT_COLOR: Record<EventKind, string> = {
  video: 'bg-sky-100 text-sky-700', reponse: 'bg-emerald-100 text-emerald-700', rdv: 'bg-amber-100 text-amber-700',
  maquette: 'bg-violet-100 text-violet-700', devis: 'bg-indigo-100 text-indigo-700', gagne: 'bg-green-100 text-green-700',
  perdu: 'bg-rose-100 text-rose-700',
}

export function TaskRow({ task, onDone }: { task: Task; onDone?: () => void }) {
  const { prospects, profiles } = useStore()
  const p = prospects.find((x) => x.id === task.prospect_id)
  const Icon = TASK_ICON[task.type]
  const done = !!task.done_at
  const late = !done && isOverdue(task.due_date)
  const who = profiles.find((x) => x.id === task.assigned_to)
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          done ? 'bg-emerald-50 text-emerald-600' : late ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {done ? <Check size={18} /> : <Icon size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{task.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {p && <StatusBadge status={p.status} />}
          {p?.city && <span>{p.city}</span>}
          {done ? (
            <span className="text-emerald-700">Fait {task.done_at && isToday(dateOf(task.done_at)) ? `à ${fmtTime(task.done_at)}` : `le ${fmtDate(task.done_at!)}`}</span>
          ) : (
            <span className={late ? 'font-medium text-rose-600' : ''}>
              {late ? `En retard (${fmtDate(task.due_date)})` : isToday(task.due_date) ? "Aujourd'hui" : fmtDate(task.due_date)}
            </span>
          )}
        </p>
      </div>
      <Avatar profile={who} />
      {p && (
        <Link to={`/prospects/${p.id}`} className="btn btn-ghost btn-sm" title="Ouvrir la fiche">
          <ExternalLink size={14} />
        </Link>
      )}
      {!done && onDone && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onDone} title="Marquer comme fait">
          <Check size={14} /> Fait
        </button>
      )}
    </li>
  )
}

export function EventRow({ event }: { event: NotableEvent }) {
  const { prospects, profiles } = useStore()
  const p = prospects.find((x) => x.id === event.prospect_id)
  const who = profiles.find((x) => x.id === event.user_id)
  const Icon = EVENT_ICON[event.kind]
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${EVENT_COLOR[event.kind]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {event.label} · {p?.business_name ?? 'Prospect supprimé'}
        </p>
        <p className="text-xs text-slate-500">
          {fmtTime(event.at)}
          {who ? ` · ${who.name}` : ''}
        </p>
      </div>
      <Avatar profile={who} />
      {p && (
        <Link to={`/prospects/${p.id}`} className="btn btn-ghost btn-sm" title="Ouvrir la fiche">
          <ExternalLink size={14} />
        </Link>
      )}
    </li>
  )
}
