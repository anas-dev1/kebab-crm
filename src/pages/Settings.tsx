import { useState } from 'react'
import { useStore } from '../data/store'
import { resetLocalDb } from '../data/localRepo'
import { RELANCE_DAYS, ROLE_LABEL } from '../lib/status'
import { saveSettings, useSettings, weeklyGoals } from '../lib/settings'
import type { Role } from '../lib/types'
import { Field, PageTitle, Section } from '../components/ui'

export function Settings() {
  const { me, mode, profiles, updateProfile, signOut } = useStore()
  const settings = useSettings()
  const goals = weeklyGoals(settings)
  const [name, setName] = useState(me?.name ?? '')
  const [role, setRole] = useState<Role>(me?.role ?? 'vendeur')
  const [saved, setSaved] = useState(false)
  if (!me) return null
  const num = (v: string, min: number) => Math.max(min, Math.floor(Number(v) || min))

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageTitle title="Réglages" />

      <Section title="Mon profil">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            await updateProfile({ name: name.trim() || me.name, role })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
          }}
        >
          <Field label="Prénom">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Rôle" hint="Le compte Dev reçoit les demandes de maquette et les clients signés. Les tâches commerciales (vidéos, relances, RDV) vont à celui qui agit, quel que soit son rôle.">
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="vendeur">{ROLE_LABEL.vendeur}</option>
              <option value="dev">{ROLE_LABEL.dev}</option>
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
            {saved && <span className="text-sm text-emerald-600">Enregistré.</span>}
          </div>
        </form>
      </Section>

      <Section title="Rythme">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Vidéos par jour" hint="Valeur par défaut de l'écran Planifier.">
            <input className="input" type="number" min={1} max={100} value={settings.videosPerDay} onChange={(e) => saveSettings({ videosPerDay: num(e.target.value, 1) })} />
          </Field>
          <Field label="Jours travaillés">
            <select className="input" value={settings.workDays} onChange={(e) => saveSettings({ workDays: e.target.value === '7' ? 7 : 5 })}>
              <option value={5}>Lundi à vendredi</option>
              <option value={7}>Toute la semaine</option>
            </select>
          </Field>
          <Field label="Prospects par semaine" hint="Objectif d'ajout pour l'équipe.">
            <input className="input" type="number" min={1} max={1000} value={settings.prospectsPerWeek} onChange={(e) => saveSettings({ prospectsPerWeek: num(e.target.value, 1) })} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Objectifs de la semaine : {goals.prospects} prospects ajoutés, {goals.videos} vidéos envoyées. Ces réglages sont propres à cet appareil.
        </p>
      </Section>

      <Section title="L'équipe">
        <ul className="divide-y divide-slate-100 text-sm">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span className="font-medium">{p.name}</span>
              <span className="text-slate-500">{ROLE_LABEL[p.role]}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Fonctionnement">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Les tâches vont à la personne qui agit (prospection, vidéo, relances), la maquette au compte Dev ; une fois prête, le prospect revient à celui qui l'a demandée.</li>
          <li>Relances automatiques à J+{RELANCE_DAYS.join(', J+')} après le passage en « Contacté ».</li>
          <li>Une réponse reçue, un RDV ou un devis annule les relances restantes.</li>
          <li>Chaque passage de relais entre vous deux crée une notification.</li>
          <li>L'écran Planifier répartit les prospects sans vidéo prévue sur les jours de la semaine ; cocher « Fait » sur une vidéo passe le prospect en « Contacté » avec ses relances.</li>
          <li>Mode actuel : <span className="font-medium">{mode === 'local' ? 'démo locale (ce navigateur seulement)' : 'partagé via Supabase'}</span>.</li>
        </ul>
      </Section>

      <Section title="Session">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Se déconnecter
          </button>
          {mode === 'local' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm('Remettre les données de démonstration ? Tout ce que tu as saisi en local sera perdu.')) resetLocalDb()
              }}
            >
              Réinitialiser la démo
            </button>
          )}
        </div>
      </Section>
    </div>
  )
}
