import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing } from 'lucide-react'
import { useStore } from '../data/store'
import { dateOf, fmtDateLong, plusDays, todayStr } from '../lib/dates'
import { STATUS } from '../lib/status'
import { notableEvents } from '../lib/week'
import { Empty, PageTitle, Section } from '../components/ui'
import { EventRow, TaskRow } from '../components/rows'

export function Today() {
  const { me, tasks, prospects, profiles, activities, completeTask } = useStore()
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const today = todayStr()
  if (!me) return null

  const mine = tasks.filter((t) => t.assigned_to === me.id && !t.done_at).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const due = mine.filter((t) => t.due_date <= today)
  const upcoming = mine.filter((t) => t.due_date > today && t.due_date <= plusDays(7))
  const other = profiles.find((p) => p.id !== me.id)
  const doneToday = tasks.filter((t) => t.assigned_to === me.id && t.done_at && dateOf(t.done_at) === today).sort((a, b) => b.done_at!.localeCompare(a.done_at!))
  const eventsToday = notableEvents(activities).filter((e) => e.user_id === me.id && e.day === today).reverse()

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

      <Section title={`Fait aujourd'hui (${doneToday.length + eventsToday.length})`}>
        {doneToday.length + eventsToday.length === 0 ? (
          <p className="text-sm text-slate-500">Rien coché ni envoyé pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {doneToday.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
            {eventsToday.map((e) => (
              <EventRow key={e.id} event={e} />
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
