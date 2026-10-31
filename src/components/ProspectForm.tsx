import { useState, type FormEvent } from 'react'
import type { Prospect } from '../lib/types'
import { Field } from './ui'

export type ProspectFormValues = Pick<
  Prospect,
  'business_name' | 'contact_name' | 'niche' | 'city' | 'phone' | 'whatsapp' | 'email' | 'website_url' | 'google_url' | 'linkedin_url' | 'instagram' | 'notes'
>

const EMPTY: ProspectFormValues = {
  business_name: '', contact_name: null, niche: null, city: null, phone: null, whatsapp: null, email: null,
  website_url: null, google_url: null, linkedin_url: null, instagram: null, notes: null,
}

export function ProspectForm({
  initial,
  niches,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ProspectFormValues>
  niches: string[]
  submitLabel: string
  onSubmit: (values: ProspectFormValues) => Promise<void>
  onCancel?: () => void
}) {
  const [v, setV] = useState<ProspectFormValues>({ ...EMPTY, ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof ProspectFormValues) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value === '' ? null : e.target.value }))
  const val = (k: keyof ProspectFormValues) => v[k] ?? ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!v.business_name.trim()) return
    setBusy(true)
    try {
      await onSubmit({ ...v, business_name: v.business_name.trim() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Entreprise *" className="sm:col-span-2">
        <input className="input" required value={v.business_name} onChange={(e) => setV((s) => ({ ...s, business_name: e.target.value }))} placeholder="Kebab du Soleil" autoFocus />
      </Field>
      <Field label="Contact">
        <input className="input" value={val('contact_name')} onChange={set('contact_name')} placeholder="Prénom du gérant" />
      </Field>
      <Field label="Niche">
        <input className="input" list="niches" value={val('niche')} onChange={set('niche')} placeholder="Kebab, coiffeur, plombier…" />
        <datalist id="niches">
          {niches.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>
      <Field label="Ville">
        <input className="input" value={val('city')} onChange={set('city')} placeholder="Lyon 7" />
      </Field>
      <Field label="Téléphone">
        <input className="input" value={val('phone')} onChange={set('phone')} placeholder="06 12 34 56 78" />
      </Field>
      <Field label="WhatsApp" hint="Numéro sans espaces, ex. 0612345678">
        <input className="input" value={val('whatsapp')} onChange={set('whatsapp')} placeholder="0612345678" />
      </Field>
      <Field label="Email">
        <input className="input" type="email" value={val('email')} onChange={set('email')} />
      </Field>
      <Field label="Site actuel">
        <input className="input" value={val('website_url')} onChange={set('website_url')} placeholder="https://" />
      </Field>
      <Field label="Fiche Google">
        <input className="input" value={val('google_url')} onChange={set('google_url')} placeholder="https://maps.google.com/…" />
      </Field>
      <Field label="LinkedIn">
        <input className="input" value={val('linkedin_url')} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Instagram">
        <input className="input" value={val('instagram')} onChange={set('instagram')} placeholder="nom.du.compte" />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className="input min-h-20" value={val('notes')} onChange={set('notes')} placeholder="Ce qui va / ce qui ne va pas sur le site actuel, infos utiles…" />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
