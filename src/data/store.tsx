import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { repo } from './index'
import { EMPTY_SNAPSHOT, type AuthUser, type Snapshot } from './repo'
import type { ActivityType, ClientStage, MockupBrief, Profile, Prospect, Role, Status, Task, TaskType } from '../lib/types'
import { CHANNELS, CLIENT_STAGES, ICON_URL, LOST_REASONS, RELANCE_DAYS, STATUS } from '../lib/status'
import { dateOf, nowIso, plusDays, todayStr } from '../lib/dates'

export type ProspectInput = Partial<Omit<Prospect, 'id' | 'created_at'>> & { business_name: string }
export type BriefInput = Partial<Omit<MockupBrief, 'id' | 'created_at' | 'prospect_id'>>

export interface StoreValue extends Snapshot {
  mode: 'local' | 'supabase'
  user: AuthUser | null | undefined
  me: Profile | undefined
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  profileOf: (id: string | null | undefined) => Profile | undefined
  briefOf: (prospectId: string) => MockupBrief | undefined
  createProspect: (input: ProspectInput) => Promise<Prospect>
  updateProspect: (id: string, patch: Partial<Prospect>) => Promise<void>
  deleteProspect: (id: string) => Promise<void>
  setStatus: (p: Prospect, status: Status, extra?: Partial<Prospect>, note?: string) => Promise<void>
  saveBrief: (prospectId: string, data: BriefInput) => Promise<void>
  requestMockup: (p: Prospect, data: BriefInput) => Promise<void>
  startMockup: (p: Prospect) => Promise<void>
  deliverMockup: (p: Prospect, url: string) => Promise<void>
  completeTask: (t: Task) => Promise<void>
  addTask: (prospectId: string, assignedTo: string | null, type: TaskType, title: string, due: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
  logActivity: (prospectId: string, type: ActivityType, content: string) => Promise<void>
  markResponse: (p: Prospect, content: string) => Promise<void>
  setClientStage: (p: Prospect, stage: ClientStage) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [snap, setSnap] = useState<Snapshot>(EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seenNotifs = useRef<Set<string> | null>(null)

  useEffect(() => {
    repo.getUser().then(setUser)
    return repo.onAuthChange(setUser)
  }, [])

  const refresh = useCallback(async () => {
    try {
      setSnap(await repo.loadAll())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setSnap(EMPTY_SNAPSHOT)
      setLoading(false)
      seenNotifs.current = null
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
    return repo.subscribe(refresh)
  }, [user, refresh])

  const me = useMemo(() => snap.profiles.find((p) => p.id === user?.id), [snap.profiles, user])

  // Notification navigateur quand une nouvelle notification arrive pour moi.
  useEffect(() => {
    if (!me) return
    const mine = snap.notifications.filter((n) => n.user_id === me.id)
    if (seenNotifs.current === null) {
      seenNotifs.current = new Set(mine.map((n) => n.id))
      return
    }
    const seen = seenNotifs.current
    for (const n of mine) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      if (!n.read_at && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(n.title, { body: n.body ?? undefined, icon: ICON_URL })
        } catch {
          /* ignore */
        }
      }
    }
  }, [snap.notifications, me])

  const value = useMemo<StoreValue>(() => {
    const profiles = snap.profiles
    const profileOf = (id: string | null | undefined) => profiles.find((p) => p.id === id)
    const byRole = (role: Role) => profiles.find((p) => p.role === role)
    const briefOf = (prospectId: string) => snap.briefs.find((b) => b.prospect_id === prospectId)
    const meId = me?.id ?? null

    // Attribution « par personne » : les tâches commerciales vont à celui qui fait l'action,
    // la maquette va au compte dev, et le prospect revient à celui qui a demandé la maquette.
    const devId = () => byRole('dev')?.id ?? meId
    // Celui qui suit le prospect côté commercial : le demandeur de la maquette, sinon le créateur, sinon le vendeur.
    const sellerOf = (p: Prospect) => briefOf(p.id)?.requested_by ?? p.created_by ?? byRole('vendeur')?.id ?? meId

    // Notifie une personne précise (jamais soi-même) ou tout le monde sauf soi ('others').
    async function notify(target: string | null | 'others', title: string, body: string | null, prospectId: string | null) {
      const targets = target === 'others' ? profiles.filter((p) => p.id !== meId) : profiles.filter((p) => p.id === target && p.id !== meId)
      for (const t of targets) {
        await repo.insert('notifications', { user_id: t.id, prospect_id: prospectId, title, body, read_at: null })
      }
    }

    async function activity(prospectId: string, type: ActivityType, content: string | null, status_to: Status | null = null) {
      await repo.insert('activities', { prospect_id: prospectId, user_id: meId, type, content, status_to })
    }

    async function addTaskRaw(prospectId: string, assignedTo: string | null, type: TaskType, title: string, due: string) {
      await repo.insert('tasks', { prospect_id: prospectId, assigned_to: assignedTo, type, title, due_date: due, done_at: null })
    }

    const pendingTasks = (prospectId: string, types?: TaskType[]) =>
      snap.tasks.filter((t) => t.prospect_id === prospectId && !t.done_at && (!types || types.includes(t.type)))

    async function closeTasks(prospectId: string, types: TaskType[]) {
      for (const t of pendingTasks(prospectId, types)) await repo.update('tasks', t.id, { done_at: nowIso() })
    }

    async function cancelTasks(prospectId: string, types?: TaskType[]) {
      for (const t of pendingTasks(prospectId, types)) await repo.remove('tasks', t.id)
    }

    async function setStatus(p: Prospect, status: Status, extra: Partial<Prospect> = {}, note?: string) {
      const name = p.business_name
      const patch: Partial<Prospect> = { ...extra, status, updated_at: nowIso() }
      const details: string[] = []

      switch (status) {
        case 'nouveau':
          patch.lost_reason = null
          patch.owner_id = meId
          break
        case 'qualifie':
          patch.owner_id = meId
          break
        case 'maquette_demandee':
          patch.owner_id = devId()
          await cancelTasks(p.id, ['maquette'])
          await addTaskRaw(p.id, devId(), 'maquette', `Maquette : ${name}`, todayStr())
          await notify(devId(), `Maquette demandée : ${name}`, 'Le brief est rempli, à toi de jouer.', p.id)
          break
        case 'maquette_en_cours':
          patch.owner_id = meId
          break
        case 'maquette_prete': {
          const back = sellerOf(p)
          patch.owner_id = back
          await closeTasks(p.id, ['maquette'])
          await cancelTasks(p.id, ['video'])
          await addTaskRaw(p.id, back, 'video', `Vidéo + envoi : ${name}`, todayStr())
          await notify(back, `Maquette prête : ${name}`, patch.mockup_url ?? p.mockup_url ?? null, p.id)
          break
        }
        case 'contacte': {
          patch.owner_id = meId
          await closeTasks(p.id, ['video'])
          await cancelTasks(p.id, ['relance'])
          for (let i = 0; i < RELANCE_DAYS.length; i++) {
            await addTaskRaw(p.id, meId, 'relance', `Relance ${i + 1}/${RELANCE_DAYS.length} : ${name}`, plusDays(RELANCE_DAYS[i]))
          }
          const ch = patch.channel ?? p.channel
          if (ch) details.push(CHANNELS[ch])
          break
        }
        case 'en_attente':
          break
        case 'rdv': {
          patch.owner_id = meId
          await cancelTasks(p.id, ['relance'])
          const when = patch.meeting_at ?? p.meeting_at
          if (when) {
            await addTaskRaw(p.id, meId, 'rdv', `RDV : ${name}`, dateOf(when))
            await notify('others', `RDV pris : ${name}`, note ?? null, p.id)
          }
          break
        }
        case 'devis_envoye':
          await cancelTasks(p.id, ['relance'])
          await addTaskRaw(p.id, meId, 'relance', `Relance devis : ${name}`, plusDays(3))
          if (patch.quote_amount != null) details.push(`${patch.quote_amount} €`)
          break
        case 'gagne':
          await cancelTasks(p.id)
          patch.client_stage = 'elements_a_recevoir'
          patch.owner_id = devId()
          await addTaskRaw(p.id, devId(), 'autre', `Récupérer les éléments : ${name}`, todayStr())
          await notify(devId(), `Vendu : ${name} 🎉`, 'Le client est à toi : éléments à récupérer, puis production.', p.id)
          break
        case 'perdu': {
          await cancelTasks(p.id)
          const reason = patch.lost_reason ?? p.lost_reason
          if (reason) details.push(LOST_REASONS[reason])
          break
        }
      }

      await repo.update('prospects', p.id, patch)
      const label = `${STATUS[p.status].label} → ${STATUS[status].label}` + (details.length ? ` (${details.join(', ')})` : '')
      await activity(p.id, 'statut', note ? `${label} · ${note}` : label, status)
      await refresh()
    }

    async function saveBriefRaw(prospectId: string, data: BriefInput) {
      const existing = briefOf(prospectId)
      if (existing) {
        await repo.update('mockup_briefs', existing.id, data)
      } else {
        await repo.insert('mockup_briefs', {
          prospect_id: prospectId,
          logo_url: null, primary_color: null, secondary_color: null, variant: null, tagline: null, services: null,
          address: null, hours: null, photos: null, reviews: null, extra_notes: null,
          requested_by: meId, requested_at: null, started_at: null, delivered_at: null,
          ...data,
        })
      }
    }

    return {
      ...snap,
      mode: repo.mode,
      user,
      me,
      loading,
      error,
      refresh,
      profileOf,
      briefOf,
      signOut: () => repo.signOut(),

      async createProspect(input) {
        const row = await repo.insert('prospects', {
          contact_name: null, phone: null, whatsapp: null, email: null, linkedin_url: null, instagram: null,
          website_url: null, google_url: null, niche: null, city: null, channel: null, lost_reason: null,
          client_stage: null, notes: null, mockup_url: null, video_url: null, meeting_at: null, quote_amount: null,
          ...input,
          status: 'nouveau',
          owner_id: meId,
          created_by: meId,
          updated_at: nowIso(),
        })
        await activity(row.id, 'statut', 'Prospect créé', 'nouveau')
        await refresh()
        return row
      },

      async updateProspect(id, patch) {
        await repo.update('prospects', id, { ...patch, updated_at: nowIso() })
        await refresh()
      },

      async deleteProspect(id) {
        await repo.remove('prospects', id)
        await refresh()
      },

      setStatus,

      async saveBrief(prospectId, data) {
        await saveBriefRaw(prospectId, data)
        await refresh()
      },

      async requestMockup(p, data) {
        await saveBriefRaw(p.id, { ...data, requested_by: meId, requested_at: nowIso() })
        await setStatus(p, 'maquette_demandee')
      },

      async startMockup(p) {
        const b = briefOf(p.id)
        if (b) await repo.update('mockup_briefs', b.id, { started_at: nowIso() })
        await setStatus(p, 'maquette_en_cours')
      },

      async deliverMockup(p, url) {
        const b = briefOf(p.id)
        if (b) await repo.update('mockup_briefs', b.id, { delivered_at: nowIso() })
        await setStatus(p, 'maquette_prete', { mockup_url: url })
      },

      async completeTask(t) {
        await repo.update('tasks', t.id, { done_at: nowIso() })
        const p = snap.prospects.find((x) => x.id === t.prospect_id)
        if (t.type === 'relance') {
          await activity(t.prospect_id, 'relance', `Relance faite (${t.title})`)
          if (p && p.status === 'contacte') {
            await repo.update('prospects', p.id, { status: 'en_attente', updated_at: nowIso() })
            await activity(p.id, 'statut', `${STATUS.contacte.label} → ${STATUS.en_attente.label}`, 'en_attente')
          }
        } else {
          await activity(t.prospect_id, 'autre', `Tâche faite : ${t.title}`)
        }
        await refresh()
      },

      async addTask(prospectId, assignedTo, type, title, due) {
        await addTaskRaw(prospectId, assignedTo, type, title, due)
        await refresh()
      },

      async removeTask(id) {
        await repo.remove('tasks', id)
        await refresh()
      },

      async logActivity(prospectId, type, content) {
        await activity(prospectId, type, content)
        await repo.update('prospects', prospectId, { updated_at: nowIso() })
        await refresh()
      },

      async markResponse(p, content) {
        await cancelTasks(p.id, ['relance'])
        await activity(p.id, 'reponse', content)
        await repo.update('prospects', p.id, { updated_at: nowIso() })
        await notify('others', `Réponse de ${p.business_name}`, content, p.id)
        await refresh()
      },

      async setClientStage(p, stage) {
        await repo.update('prospects', p.id, { client_stage: stage, updated_at: nowIso() })
        await activity(p.id, 'autre', `Client : ${CLIENT_STAGES[stage]}`)
        await refresh()
      },

      async markNotificationRead(id) {
        await repo.update('notifications', id, { read_at: nowIso() })
        await refresh()
      },

      async markAllRead() {
        for (const n of snap.notifications) {
          if (n.user_id === meId && !n.read_at) await repo.update('notifications', n.id, { read_at: nowIso() })
        }
        await refresh()
      },

      async updateProfile(patch) {
        if (!me) return
        await repo.update('profiles', me.id, patch)
        await refresh()
      },
    }
  }, [snap, user, me, loading, error, refresh])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider')
  return ctx
}
