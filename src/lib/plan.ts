import type { Prospect, Status, Task } from './types'
import { isWeekendDay, shiftDays } from './dates'

// Statuts où une vidéo reste à faire. « Maquette prête » reçoit déjà sa tâche automatiquement,
// mais si elle a été supprimée le prospect redevient planifiable.
export const PLANNABLE_STATUSES: Status[] = ['nouveau', 'qualifie', 'maquette_prete']

export const pendingVideoTask = (tasks: Task[], prospectId: string) =>
  tasks.find((t) => t.prospect_id === prospectId && t.type === 'video' && !t.done_at)

// Prospects à qui personne n'a encore prévu d'envoyer une vidéo, du plus ancien au plus récent.
export function unplanned(prospects: Prospect[], tasks: Task[]): Prospect[] {
  return prospects
    .filter((p) => PLANNABLE_STATUSES.includes(p.status) && !pendingVideoTask(tasks, p.id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export interface DistributeOptions {
  perDay: number
  start: string
  workDaysOnly: boolean
  // Nombre de vidéos déjà prévues ce jour-là pour la personne : on complète jusqu'au quota.
  existing: (day: string) => number
}

// Répartit des prospects sur les jours à partir de `start`, `perDay` par jour au maximum.
export function distribute(ids: string[], { perDay, start, workDaysOnly, existing }: DistributeOptions): { prospectId: string; due: string }[] {
  const out: { prospectId: string; due: string }[] = []
  if (perDay < 1) return out
  let day = start
  let i = 0
  for (let guard = 0; i < ids.length && guard < 365; guard++, day = shiftDays(day, 1)) {
    if (workDaysOnly && isWeekendDay(day)) continue
    let room = perDay - existing(day)
    while (room > 0 && i < ids.length) {
      out.push({ prospectId: ids[i++], due: day })
      room--
    }
  }
  return out
}
