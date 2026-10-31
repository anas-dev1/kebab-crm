import { useState, type FormEvent } from 'react'
import type { BriefInput } from '../data/store'
import type { MockupBrief } from '../lib/types'
import { Field } from './ui'

type Keys = 'logo_url' | 'primary_color' | 'secondary_color' | 'variant' | 'tagline' | 'services' | 'address' | 'hours' | 'photos' | 'reviews' | 'extra_notes'
type Values = Record<Keys, string>

const EMPTY: Values = {
  logo_url: '', primary_color: '#c2410c', secondary_color: '#1c1917', variant: 'A', tagline: '', services: '',
  address: '', hours: '', photos: '', reviews: '', extra_notes: '',
}

export function BriefForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: MockupBrief | null
  submitLabel: string
  onSubmit: (values: BriefInput) => Promise<void>
  onCancel?: () => void
}) {
  const [v, setV] = useState<Values>(() => {
    const base = { ...EMPTY }
    if (initial) {
      for (const k of Object.keys(EMPTY) as Keys[]) {
        const val = initial[k]
        if (val) base[k] = val
      }
    }
    return base
  })
  const [busy, setBusy] = useState(false)
  const set = (k: Keys) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const out: BriefInput = {}
      for (const k of Object.keys(EMPTY) as Keys[]) out[k] = v[k].trim() === '' ? null : v[k].trim()
      await onSubmit(out)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Logo (lien)" className="sm:col-span-2" hint="Lien vers le logo, ou une capture du site actuel / fiche Google.">
        <input className="input" value={v.logo_url} onChange={set('logo_url')} placeholder="https://" />
      </Field>
      <Field label="Couleur principale">
        <div className="flex gap-2">
          <input type="color" className="h-9 w-12 cursor-pointer rounded border border-slate-300" value={v.primary_color || '#000000'} onChange={set('primary_color')} />
          <input className="input" value={v.primary_color} onChange={set('primary_color')} />
        </div>
      </Field>
      <Field label="Couleur secondaire">
        <div className="flex gap-2">
          <input type="color" className="h-9 w-12 cursor-pointer rounded border border-slate-300" value={v.secondary_color || '#000000'} onChange={set('secondary_color')} />
          <input className="input" value={v.secondary_color} onChange={set('secondary_color')} />
        </div>
      </Field>
      <Field label="Variante du gabarit" hint="Évite de donner la même variante à deux concurrents de la même ville.">
        <select className="input" value={v.variant} onChange={set('variant')}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </Field>
      <Field label="Accroche">
        <input className="input" value={v.tagline} onChange={set('tagline')} placeholder="Le vrai kebab turc à Lyon 7" />
      </Field>
      <Field label="Services / produits" className="sm:col-span-2">
        <textarea className="input min-h-16" value={v.services} onChange={set('services')} placeholder="Kebab, dürüm, assiettes, livraison, menus étudiants…" />
      </Field>
      <Field label="Adresse">
        <input className="input" value={v.address} onChange={set('address')} />
      </Field>
      <Field label="Horaires">
        <input className="input" value={v.hours} onChange={set('hours')} placeholder="Lun-Dim 11h-23h" />
      </Field>
      <Field label="Photos (un lien par ligne)" className="sm:col-span-2">
        <textarea className="input min-h-16 font-mono text-xs" value={v.photos} onChange={set('photos')} placeholder={'https://…\nhttps://…'} />
      </Field>
      <Field label="Avis à mettre en avant" className="sm:col-span-2">
        <textarea className="input min-h-16" value={v.reviews} onChange={set('reviews')} placeholder="4,6 sur Google (312 avis) · « Le meilleur kebab du quartier »" />
      </Field>
      <Field label="Notes pour le dev" className="sm:col-span-2">
        <textarea className="input min-h-16" value={v.extra_notes} onChange={set('extra_notes')} placeholder="Ce qu'il faut absolument mettre en avant, ce qu'il faut éviter…" />
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
