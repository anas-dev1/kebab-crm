import { addDays, format, formatDistanceToNowStrict, parseISO } from 'date-fns'
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
export const dateOf = (iso: string) => iso.slice(0, 10)
