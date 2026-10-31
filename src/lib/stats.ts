import type { Activity, Channel, LostReason, Prospect, Status } from './types'

export interface Funnel {
  total: number
  contacted: number
  replied: number
  meetings: number
  quotes: number
  won: number
}

const REPLIED_STATUSES: Status[] = ['rdv', 'devis_envoye', 'gagne']

export function reachedSet(activities: Activity[], statuses: Status[]): Set<string> {
  const set = new Set<string>()
  for (const a of activities) if (a.status_to && statuses.includes(a.status_to)) set.add(a.prospect_id)
  return set
}

export function computeFunnel(prospects: Prospect[], activities: Activity[]): Funnel {
  const ids = new Set(prospects.map((p) => p.id))
  const acts = activities.filter((a) => ids.has(a.prospect_id))
  const contacted = reachedSet(acts, ['contacte', 'en_attente', ...REPLIED_STATUSES])
  const replied = reachedSet(acts, REPLIED_STATUSES)
  for (const a of acts) if (a.type === 'reponse') replied.add(a.prospect_id)
  const meetings = reachedSet(acts, ['rdv'])
  const quotes = reachedSet(acts, ['devis_envoye'])
  const won = reachedSet(acts, ['gagne'])
  // Un prospect qui a eu un RDV ou un devis a forcément répondu, même sans activité "réponse".
  for (const id of meetings) replied.add(id)
  for (const id of quotes) replied.add(id)
  for (const id of won) replied.add(id)
  return { total: prospects.length, contacted: contacted.size, replied: replied.size, meetings: meetings.size, quotes: quotes.size, won: won.size }
}

export function groupBy<K extends string>(prospects: Prospect[], key: (p: Prospect) => K | null): Map<K, Prospect[]> {
  const map = new Map<K, Prospect[]>()
  for (const p of prospects) {
    const k = key(p)
    if (!k) continue
    map.set(k, [...(map.get(k) ?? []), p])
  }
  return map
}

export const byChannel = (prospects: Prospect[]) => groupBy<Channel>(prospects, (p) => p.channel)
export const byNiche = (prospects: Prospect[]) => groupBy<string>(prospects, (p) => p.niche)
export const byLostReason = (prospects: Prospect[]) => groupBy<LostReason>(prospects.filter((p) => p.status === 'perdu'), (p) => p.lost_reason ?? 'autre')

export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))
