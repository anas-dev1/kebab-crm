import type { Activity, Prospect, Status, Task } from './types'
import { dateOf } from './dates'

// Les changements de statut qui méritent d'apparaître dans la semaine (le reste noierait l'écran).
const NOTABLE_STATUS: Status[] = ['maquette_prete', 'contacte', 'rdv', 'devis_envoye', 'gagne', 'perdu']

export type EventKind = 'video' | 'reponse' | 'rdv' | 'maquette' | 'devis' | 'gagne' | 'perdu'

export interface NotableEvent {
  id: string
  at: string
  day: string
  kind: EventKind
  label: string
  prospect_id: string
  user_id: string | null
}

function kindOf(a: Activity): EventKind | null {
  if (a.type === 'video') return 'video'
  if (a.type === 'reponse') return 'reponse'
  if (a.type === 'rdv') return 'rdv'
  if (a.type !== 'statut' || !a.status_to || !NOTABLE_STATUS.includes(a.status_to)) return null
  switch (a.status_to) {
    case 'maquette_prete': return 'maquette'
    case 'contacte': return 'video'
    case 'rdv': return 'rdv'
    case 'devis_envoye': return 'devis'
    case 'gagne': return 'gagne'
    case 'perdu': return 'perdu'
    default: return null
  }
}

export const EVENT_LABEL: Record<EventKind, string> = {
  video: 'Vidéo envoyée', reponse: 'Réponse reçue', rdv: 'Rendez-vous', maquette: 'Maquette prête',
  devis: 'Devis envoyé', gagne: 'Gagné', perdu: 'Perdu',
}

export function notableEvents(activities: Activity[]): NotableEvent[] {
  const out: NotableEvent[] = []
  for (const a of activities) {
    const kind = kindOf(a)
    if (!kind) continue
    out.push({ id: a.id, at: a.created_at, day: dateOf(a.created_at), kind, label: EVENT_LABEL[kind], prospect_id: a.prospect_id, user_id: a.user_id })
  }
  return out.sort((x, y) => x.at.localeCompare(y.at))
}

export interface PeriodSummary {
  planned: number
  done: number
  prospects: number
  videos: number
  responses: number
  meetings: number
  won: number
}

const inRange = (day: string, from: string, to: string) => day >= from && day <= to

// Bilan d'une période [from, to] (dates yyyy-MM-dd incluses), pour une personne ou pour tout le monde (userId null).
export function summarize(
  { tasks, prospects, activities }: { tasks: Task[]; prospects: Prospect[]; activities: Activity[] },
  from: string,
  to: string,
  userId: string | null,
): PeriodSummary {
  const mineTask = (t: Task) => userId === null || t.assigned_to === userId
  const mineAct = (a: { user_id: string | null }) => userId === null || a.user_id === userId
  const events = notableEvents(activities).filter((e) => inRange(e.day, from, to) && mineAct(e))
  const distinct = (kind: EventKind) => new Set(events.filter((e) => e.kind === kind).map((e) => e.prospect_id)).size
  return {
    planned: tasks.filter((t) => mineTask(t) && inRange(t.due_date, from, to)).length,
    done: tasks.filter((t) => mineTask(t) && t.done_at && inRange(dateOf(t.done_at), from, to)).length,
    prospects: prospects.filter((p) => inRange(dateOf(p.created_at), from, to) && (userId === null || p.created_by === userId)).length,
    videos: distinct('video'),
    responses: distinct('reponse'),
    meetings: distinct('rdv'),
    won: distinct('gagne'),
  }
}

