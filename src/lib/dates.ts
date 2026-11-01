import { addDays, format, formatDistanceToNowStrict, isWeekend, parseISO, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

export const nowIso = () => new Date().toISOString()
export const todayStr = () => format(new Date(), 'yyyy-MM-dd')
export const plusDays = (n: number, from: Date = new Date()) => format(addDays(from, n), 'yyyy-MM-dd')
export const fmtDate = (s: string) => format(parseISO(s), 'd MMM', { locale: fr })
export const fmtDateLong = (s: string) => format(parseISO(s), 'EEEE d MMMM', { locale: fr })
export const fmtDateTime = (s: string) => format(parseISO(s), "d MMM 'à' HH:mm", { locale: fr })
export const ago = (s: string) => formatDistanceToNowStrict(parseISO(s), { locale: fr, addSuffix: true })
export const isOverdue = (due: string) => due < todayStr()
export const isToday = (due: string) => due === todayStr()
// Jour local (yyyy-MM-dd) d'un horodatage ISO : ne pas découper la chaîne, elle est en UTC.
export const dateOf = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd')

// Semaine du lundi au dimanche. `offset` = 0 pour la semaine en cours, -1 la précédente, etc.
export const weekStartStr = (offset = 0) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7), 'yyyy-MM-dd')
export const shiftDays = (s: string, n: number) => format(addDays(parseISO(s), n), 'yyyy-MM-dd')
export const weekDays = (start: string) => Array.from({ length: 7 }, (_, i) => shiftDays(start, i))
export const fmtDayShort = (s: string) => format(parseISO(s), 'EEE d', { locale: fr })
export const fmtWeekRange = (start: string) => {
  const a = parseISO(start)
  const b = addDays(a, 6)
  const sameMonth = a.getMonth() === b.getMonth()
  return `${format(a, sameMonth ? 'd' : 'd MMM', { locale: fr })} – ${format(b, 'd MMM yyyy', { locale: fr })}`
}
export const fmtTime = (iso: string) => format(parseISO(iso), 'HH:mm')
export const isWeekendDay = (s: string) => isWeekend(parseISO(s))
// Prochain jour (à partir de demain) où planifier : saute le week-end si demandé.
export const nextPlanningDay = (workDaysOnly: boolean) => {
  let d = plusDays(1)
  while (workDaysOnly && isWeekendDay(d)) d = shiftDays(d, 1)
  return d
}
