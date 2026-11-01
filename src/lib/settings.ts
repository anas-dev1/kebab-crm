import { useSyncExternalStore } from 'react'

// Réglages de rythme, propres à cet appareil (localStorage) : ils servent aux objectifs
// de la semaine et aux valeurs par défaut de l'écran Planifier.
export interface AppSettings {
  videosPerDay: number
  workDays: 5 | 7
  prospectsPerWeek: number
}

const KEY = 'kebab-crm-settings'
const DEFAULTS: AppSettings = { videosPerDay: 10, workDays: 5, prospectsPerWeek: 50 }

let cache: AppSettings | null = null
const listeners = new Set<() => void>()

function read(): AppSettings {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULTS
  } catch {
    cache = DEFAULTS
  }
  return cache
}

export function getSettings(): AppSettings {
  return read()
}

export function saveSettings(patch: Partial<AppSettings>) {
  cache = { ...read(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    read,
    read,
  )
}

// Objectifs d'équipe par semaine, dérivés du rythme choisi.
export const weeklyGoals = (s: AppSettings) => ({ prospects: s.prospectsPerWeek, videos: s.videosPerDay * s.workDays })
