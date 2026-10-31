import { createClient } from '@supabase/supabase-js'
import type { AuthUser, NewRow, Repo, Snapshot } from './repo'
import type { TableName, Tables } from '../lib/types'

export function createSupabaseRepo(url: string, anonKey: string): Repo {
  const sb = createClient(url, anonKey)

  const toUser = (u: { id: string; email?: string } | null | undefined): AuthUser | null =>
    u ? { id: u.id, email: u.email ?? null } : null

  async function fetchAll<K extends TableName>(table: K, order = 'created_at'): Promise<Tables[K][]> {
    const { data, error } = await sb.from(table).select('*').order(order, { ascending: false }).limit(5000)
    if (error) throw error
    return (data ?? []) as Tables[K][]
  }

  return {
    mode: 'supabase',
    async getUser() {
      const { data } = await sb.auth.getSession()
      return toUser(data.session?.user)
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password, name, role) {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { name, role } } })
      if (error) throw error
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async loadAll(): Promise<Snapshot> {
      const [profiles, prospects, briefs, tasks, activities, notifications] = await Promise.all([
        fetchAll('profiles'),
        fetchAll('prospects'),
        fetchAll('mockup_briefs'),
        fetchAll('tasks'),
        fetchAll('activities'),
        fetchAll('notifications'),
      ])
      return { profiles, prospects, briefs, tasks, activities, notifications }
    },
    async insert<K extends TableName>(table: K, row: NewRow<K>): Promise<Tables[K]> {
      const { data, error } = await sb.from(table).insert(row).select().single()
      if (error) throw error
      return data as Tables[K]
    },
    async update<K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>) {
      const { error } = await sb.from(table).update(patch as Tables[K]).eq('id', id)
      if (error) throw error
    },
    async remove(table, id) {
      const { error } = await sb.from(table).delete().eq('id', id)
      if (error) throw error
    },
    subscribe(cb) {
      const channel = sb
        .channel('kebab-crm-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => cb())
        .subscribe()
      return () => {
        void sb.removeChannel(channel)
      }
    },
  }
}
