import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Check, CalendarCheck, CircleDot, ExternalLink, Globe, Camera, Briefcase, Mail, MapPin, MessageCircle,
  PencilRuler, Phone, Plus, Repeat, Trash2, Video, MessageSquareReply, StickyNote, Pencil,
} from 'lucide-react'
import { useStore } from '../data/store'
import { ACTIVITY_TYPES, CHANNELS, CLIENT_STAGES, CLIENT_STAGE_ORDER, LOST_REASONS, ROLE_LABEL, STATUS, STATUS_ORDER, TASK_TYPES } from '../lib/status'
import { ago, fmtDate, fmtDateTime, isOverdue, todayStr } from '../lib/dates'
import type { ActivityType, Channel, ClientStage, LostReason, Prospect, Status, TaskType } from '../lib/types'
import { Avatar, Dialog, Empty, Field, Section, StatusBadge } from '../components/ui'
import { ProspectForm } from '../components/ProspectForm'
import { BriefForm } from '../components/BriefForm'

type DialogKind = null | 'brief' | 'maquette_prete' | 'contacte' | 'reponse' | 'rdv' | 'devis' | 'gagne' | 'perdu' | 'statut' | 'edit' | 'tache' | 'supprimer'

const TASK_ICON: Record<TaskType, typeof Check> = {
  relance: Repeat, maquette: PencilRuler, video: Video, appel: Phone, rdv: CalendarCheck, autre: CircleDot,
}
const ACTIVITY_ICON: Record<ActivityType, typeof Check> = {
  note: StickyNote, appel: Phone, video: Video, reponse: MessageSquareReply, statut: CircleDot, relance: Repeat, rdv: CalendarCheck, maquette: PencilRuler, autre: CircleDot,
}

const waLink = (num: string) => {
  const digits = num.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `33${digits.slice(1)}` : digits
  return `https://wa.me/${intl}`
}

function Chip({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
      {icon} {label}
    </a>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  )
}

export function ProspectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const { me, prospects, tasks, activities, profiles, profileOf, briefOf } = store
  const p = prospects.find((x) => x.id === id)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [note, setNote] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [mockupUrl, setMockupUrl] = useState<string | null>(null)

  const niches = useMemo(() => Array.from(new Set(prospects.map((x) => x.niche).filter((n): n is string => !!n))).sort(), [prospects])

  if (!p || !me) {
    return (
      <Empty title="Prospect introuvable">
        <Link to="/pipeline" className="btn btn-primary">
          Retour au pipeline
        </Link>
      </Empty>
    )
  }

  const brief = briefOf(p.id)
  const owner = profileOf(p.owner_id)
  const pTasks = tasks.filter((t) => t.prospect_id === p.id)
  const pending = pTasks.filter((t) => !t.done_at).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const done = pTasks.filter((t) => t.done_at).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))
  const timeline = activities.filter((a) => a.prospect_id === p.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const close = () => setDialog(null)

  type Action = { label: string; kind: 'primary' | 'ghost' | 'danger'; run: () => void; icon?: ReactNode }
  const open = (k: DialogKind) => () => setDialog(k)
  const perdu: Action = { label: 'Perdu', kind: 'danger', run: open('perdu') }
  const reponse: Action = { label: 'Réponse reçue', kind: 'ghost', run: open('reponse'), icon: <MessageSquareReply size={16} /> }
  const rdv: Action = { label: 'RDV pris', kind: 'ghost', run: open('rdv'), icon: <CalendarCheck size={16} /> }
  const devis: Action = { label: 'Devis envoyé', kind: 'ghost', run: open('devis') }
  const gagne: Action = { label: 'Gagné', kind: 'ghost', run: open('gagne'), icon: <Check size={16} /> }

  const actions: Action[] = (() => {
    switch (p.status) {
      case 'nouveau':
        return [
          { label: 'Qualifier', kind: 'primary', run: () => void store.setStatus(p, 'qualifie'), icon: <Check size={16} /> },
          { label: 'Demander la maquette', kind: 'ghost', run: open('brief'), icon: <PencilRuler size={16} /> },
          perdu,
        ]
      case 'qualifie':
        return [{ label: 'Demander la maquette', kind: 'primary', run: open('brief'), icon: <PencilRuler size={16} /> }, perdu]
      case 'maquette_demandee':
        return [
          { label: 'Je prends la maquette', kind: 'primary', run: () => void store.startMockup(p), icon: <PencilRuler size={16} /> },
          { label: 'Maquette prête', kind: 'ghost', run: open('maquette_prete') },
        ]
      case 'maquette_en_cours':
        return [{ label: 'Maquette prête', kind: 'primary', run: open('maquette_prete'), icon: <Check size={16} /> }]
      case 'maquette_prete':
        return [{ label: 'Appel + vidéo envoyés', kind: 'primary', run: open('contacte'), icon: <Video size={16} /> }, reponse, perdu]
      case 'contacte':
      case 'en_attente':
        return [{ ...reponse, kind: 'primary' }, rdv, devis, perdu]
      case 'rdv':
        return [{ ...devis, kind: 'primary' }, gagne, reponse, perdu]
      case 'devis_envoye':
        return [{ ...gagne, kind: 'primary' }, reponse, perdu]
      case 'gagne':
        return []
      case 'perdu':
        return [{ label: 'Réactiver', kind: 'primary', run: () => void store.setStatus(p, 'nouveau') }]
    }
  })()

  const btnClass = (k: Action['kind']) => (k === 'primary' ? 'btn btn-accent' : k === 'danger' ? 'btn btn-danger' : 'btn btn-ghost')

  return (
    <div className="space-y-5">
      <div>
        <Link to="/pipeline" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={14} /> Pipeline
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{p.business_name}</h1>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[p.contact_name, p.city, p.niche].filter(Boolean).join(' · ') || 'Aucune info'} · ajouté {ago(p.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
            <Avatar profile={owner} />
            <span>
              Chez <span className="font-medium">{owner ? (owner.id === me.id ? 'moi' : owner.name) : 'personne'}</span>
              {owner && <span className="text-slate-400"> · {ROLE_LABEL[owner.role]}</span>}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.phone && <Chip href={`tel:${p.phone.replace(/\s/g, '')}`} icon={<Phone size={14} />} label={p.phone} />}
          {p.whatsapp && <Chip href={waLink(p.whatsapp)} icon={<MessageCircle size={14} />} label="WhatsApp" />}
          {p.email && <Chip href={`mailto:${p.email}`} icon={<Mail size={14} />} label="Email" />}
          {p.website_url && <Chip href={p.website_url} icon={<Globe size={14} />} label="Site actuel" />}
          {p.google_url && <Chip href={p.google_url} icon={<MapPin size={14} />} label="Fiche Google" />}
          {p.linkedin_url && <Chip href={p.linkedin_url} icon={<Briefcase size={14} />} label="LinkedIn" />}
          {p.instagram && <Chip href={`https://instagram.com/${p.instagram.replace('@', '')}`} icon={<Camera size={14} />} label="Instagram" />}
          {p.mockup_url && <Chip href={p.mockup_url} icon={<PencilRuler size={14} />} label="Maquette" />}
          {p.video_url && <Chip href={p.video_url} icon={<Video size={14} />} label="Vidéo" />}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section
            title="Prochaine étape"
            right={
              <button type="button" className="text-xs text-slate-500 hover:text-slate-900" onClick={open('statut')}>
                Autre statut…
              </button>
            }
          >
            <p className="mb-3 text-sm text-slate-600">
              <span className="font-medium">{STATUS[p.status].label}</span> · {STATUS[p.status].hint}
              {p.meeting_at && p.status === 'rdv' && <span> · le {fmtDateTime(p.meeting_at)}</span>}
              {p.quote_amount != null && (p.status === 'devis_envoye' || p.status === 'gagne') && <span> · {p.quote_amount} €</span>}
              {p.status === 'perdu' && p.lost_reason && <span> · {LOST_REASONS[p.lost_reason]}</span>}
            </p>
            {p.status === 'gagne' ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-600">Étape client :</span>
                <select className="input w-auto" value={p.client_stage ?? 'elements_a_recevoir'} onChange={(e) => void store.setClientStage(p, e.target.value as ClientStage)}>
                  {CLIENT_STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {CLIENT_STAGES[s]}
                    </option>
                  ))}
                </select>
                <Link to="/clients" className="text-sm text-slate-500 hover:underline">
                  Voir les clients
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <button key={a.label} type="button" className={btnClass(a.kind)} onClick={a.run}>
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section
            title={`Tâches (${pending.length})`}
            right={
              <button type="button" className="btn btn-ghost btn-sm" onClick={open('tache')}>
                <Plus size={14} /> Tâche
              </button>
            }
          >
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche en attente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pending.map((t) => {
                  const Icon = TASK_ICON[t.type]
                  const late = isOverdue(t.due_date)
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-2">
                      <Icon size={16} className={late ? 'text-rose-600' : 'text-slate-500'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-slate-500">
                          <span className={late ? 'font-medium text-rose-600' : ''}>{t.due_date === todayStr() ? "Aujourd'hui" : fmtDate(t.due_date)}</span>
                          {' · '}
                          {profileOf(t.assigned_to)?.name ?? 'non assigné'}
                        </p>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" title="Supprimer" onClick={() => void store.removeTask(t.id)}>
                        <Trash2 size={14} />
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void store.completeTask(t)}>
                        <Check size={14} /> Fait
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {done.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-500">{done.length} tâche(s) terminée(s)</summary>
                <ul className="mt-1 space-y-1 text-xs text-slate-500">
                  {done.map((t) => (
                    <li key={t.id} className="line-through">
                      {t.title} · {t.done_at ? fmtDate(t.done_at) : ''}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Section>

          <Section title="Journal">
            <form
              className="mb-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!note.trim()) return
                await store.logActivity(p.id, 'note', note.trim())
                setNote('')
              }}
            >
              <input className="input" placeholder="Ajouter une note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={!note.trim()}>
                Noter
              </button>
              <button type="button" className="btn btn-ghost" title="Consigner un appel" onClick={() => void store.logActivity(p.id, 'appel', note.trim() || 'Appel passé')}>
                <Phone size={16} />
              </button>
            </form>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500">Rien pour l'instant.</p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((a) => {
                  const Icon = ACTIVITY_ICON[a.type]
                  const u = profileOf(a.user_id)
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{ACTIVITY_TYPES[a.type]}</span>
                          {a.content && <span className="text-slate-700"> · {a.content}</span>}
                        </p>
                        <p className="text-xs text-slate-400">
                          {u?.name ?? 'Système'} · {fmtDateTime(a.created_at)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            title="Infos"
            right={
              <button type="button" className="btn btn-ghost btn-sm" onClick={open('edit')}>
                <Pencil size={14} /> Modifier
              </button>
            }
          >
            <Row label="Contact" value={p.contact_name} />
            <Row label="Niche" value={p.niche} />
            <Row label="Ville" value={p.city} />
            <Row label="Téléphone" value={p.phone} />
            <Row label="WhatsApp" value={p.whatsapp} />
            <Row label="Email" value={p.email} />
            <Row label="Canal" value={p.channel ? CHANNELS[p.channel] : null} />
            <Row label="Notes" value={p.notes ? <span className="whitespace-pre-wrap">{p.notes}</span> : null} />
            {!p.contact_name && !p.phone && !p.whatsapp && !p.notes && <p className="text-sm text-slate-400">Pas encore d'infos de contact.</p>}
          </Section>

          <Section
            title="Maquette"
            right={
              <button type="button" className="btn btn-ghost btn-sm" onClick={open('brief')}>
                <Pencil size={14} /> {brief ? 'Brief' : 'Remplir le brief'}
              </button>
            }
          >
            {brief ? (
              <div>
                <Row label="Variante" value={brief.variant} />
                <Row
                  label="Couleurs"
                  value={
                    <span className="inline-flex items-center gap-2">
                      {brief.primary_color && <span className="inline-block h-4 w-4 rounded ring-1 ring-slate-300" style={{ background: brief.primary_color }} />}
                      {brief.secondary_color && <span className="inline-block h-4 w-4 rounded ring-1 ring-slate-300" style={{ background: brief.secondary_color }} />}
                      <span className="text-xs text-slate-500">{[brief.primary_color, brief.secondary_color].filter(Boolean).join(' / ')}</span>
                    </span>
                  }
                />
                <Row label="Accroche" value={brief.tagline} />
                <Row label="Services" value={brief.services} />
                <Row label="Adresse" value={brief.address} />
                <Row label="Horaires" value={brief.hours} />
                <Row label="Avis" value={brief.reviews} />
                <Row
                  label="Logo"
                  value={
                    brief.logo_url ? (
                      <a href={brief.logo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-700 underline">
                        ouvrir <ExternalLink size={12} />
                      </a>
                    ) : null
                  }
                />
                <Row
                  label="Photos"
                  value={
                    brief.photos ? (
                      <span className="space-x-2">
                        {brief.photos
                          .split('\n')
                          .filter((l) => l.trim())
                          .map((l, i) => (
                            <a key={i} href={l.trim()} target="_blank" rel="noreferrer" className="underline">
                              photo {i + 1}
                            </a>
                          ))}
                      </span>
                    ) : null
                  }
                />
                <Row label="Notes dev" value={brief.extra_notes ? <span className="whitespace-pre-wrap">{brief.extra_notes}</span> : null} />
                <p className="mt-2 text-xs text-slate-400">
                  {brief.requested_at && <>Demandée {ago(brief.requested_at)}</>}
                  {brief.started_at && <> · prise {ago(brief.started_at)}</>}
                  {brief.delivered_at && <> · livrée {ago(brief.delivered_at)}</>}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Pas de brief. Le vendeur le remplit avant de demander la maquette.</p>
            )}
            <form
              className="mt-3 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                await store.updateProspect(p.id, { mockup_url: (mockupUrl ?? p.mockup_url ?? '').trim() || null })
                setMockupUrl(null)
              }}
            >
              <input className="input" placeholder="Lien de la maquette en ligne" value={mockupUrl ?? p.mockup_url ?? ''} onChange={(e) => setMockupUrl(e.target.value)} />
              {mockupUrl !== null && mockupUrl !== (p.mockup_url ?? '') && (
                <button type="submit" className="btn btn-primary btn-sm">
                  OK
                </button>
              )}
            </form>
          </Section>

          <Section title="Vidéo">
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                await store.updateProspect(p.id, { video_url: (videoUrl ?? p.video_url ?? '').trim() || null })
                setVideoUrl(null)
              }}
            >
              <input className="input" placeholder="Lien de la vidéo (Loom, Drive…)" value={videoUrl ?? p.video_url ?? ''} onChange={(e) => setVideoUrl(e.target.value)} />
              {videoUrl !== null && videoUrl !== (p.video_url ?? '') && (
                <button type="submit" className="btn btn-primary btn-sm">
                  OK
                </button>
              )}
            </form>
          </Section>

          <button type="button" className="btn btn-danger w-full" onClick={open('supprimer')}>
            <Trash2 size={14} /> Supprimer ce prospect
          </button>
        </div>
      </div>

      {/* ---- Dialogues ---- */}
      <Dialog open={dialog === 'edit'} onClose={close} title="Modifier le prospect">
        <ProspectForm
          initial={p}
          niches={niches}
          submitLabel="Enregistrer"
          onCancel={close}
          onSubmit={async (v) => {
            await store.updateProspect(p.id, v)
            close()
          }}
        />
      </Dialog>

      <Dialog open={dialog === 'brief'} onClose={close} title={p.status === 'nouveau' || p.status === 'qualifie' ? 'Demander la maquette' : 'Brief de la maquette'}>
        <p className="mb-4 text-sm text-slate-500">Tout ce dont le dev a besoin pour générer la maquette sans te reposer de question.</p>
        <BriefForm
          initial={brief}
          submitLabel={p.status === 'nouveau' || p.status === 'qualifie' ? 'Envoyer la demande au dev' : 'Enregistrer le brief'}
          onCancel={close}
          onSubmit={async (v) => {
            if (p.status === 'nouveau' || p.status === 'qualifie') await store.requestMockup(p, v)
            else await store.saveBrief(p.id, v)
            close()
          }}
        />
      </Dialog>

      <UrlDialog open={dialog === 'maquette_prete'} onClose={close} initial={p.mockup_url ?? ''} onSubmit={(url) => store.deliverMockup(p, url)} />
      <ContactDialog open={dialog === 'contacte'} onClose={close} prospect={p} />
      <ResponseDialog open={dialog === 'reponse'} onClose={close} prospect={p} />
      <RdvDialog open={dialog === 'rdv'} onClose={close} prospect={p} />
      <AmountDialog open={dialog === 'devis'} onClose={close} title="Devis envoyé" initial={p.quote_amount ?? 500} onSubmit={(amount) => store.setStatus(p, 'devis_envoye', { quote_amount: amount })} />
      <AmountDialog open={dialog === 'gagne'} onClose={close} title="Vendu !" initial={p.quote_amount ?? 500} onSubmit={(amount) => store.setStatus(p, 'gagne', { quote_amount: amount })} />
      <LostDialog open={dialog === 'perdu'} onClose={close} prospect={p} />
      <StatusDialog open={dialog === 'statut'} onClose={close} prospect={p} />
      <TaskDialog open={dialog === 'tache'} onClose={close} prospectId={p.id} defaultAssignee={me.id} profiles={profiles} />

      <Dialog open={dialog === 'supprimer'} onClose={close} title="Supprimer ce prospect ?">
        <p className="mb-4 text-sm text-slate-600">La fiche, le brief, les tâches et le journal de {p.business_name} seront supprimés. Préfère « Perdu » si tu veux garder la trace.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={close}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              await store.deleteProspect(p.id)
              navigate('/pipeline')
            }}
          >
            Supprimer
          </button>
        </div>
      </Dialog>
    </div>
  )
}

/* ---------- Petits dialogues ---------- */

function DialogForm({ onSubmit, onCancel, submitLabel, children }: { onSubmit: () => Promise<void>; onCancel: () => void; submitLabel: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit()
      onCancel()
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function UrlDialog({ open, onClose, initial, onSubmit }: { open: boolean; onClose: () => void; initial: string; onSubmit: (url: string) => Promise<void> }) {
  const [url, setUrl] = useState(initial)
  return (
    <Dialog open={open} onClose={onClose} title="Maquette prête">
      <DialogForm onCancel={onClose} submitLabel="Prévenir le vendeur" onSubmit={() => onSubmit(url.trim())}>
        <Field label="Lien de la maquette" hint="Une adresse que le prospect pourra ouvrir sur son téléphone après la vidéo.">
          <input className="input" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://nom-du-prospect.votredomaine.fr" autoFocus />
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function ContactDialog({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: Prospect }) {
  const store = useStore()
  const [channel, setChannel] = useState<Channel>(prospect.channel ?? (prospect.whatsapp ? 'whatsapp' : prospect.linkedin_url ? 'linkedin' : 'telephone'))
  const [video, setVideo] = useState(prospect.video_url ?? '')
  const [note, setNote] = useState('')
  return (
    <Dialog open={open} onClose={onClose} title="Appel + vidéo envoyés">
      <DialogForm
        onCancel={onClose}
        submitLabel="Programmer les relances"
        onSubmit={async () => {
          await store.logActivity(prospect.id, 'video', `Vidéo envoyée par ${CHANNELS[channel]}${note.trim() ? ` · ${note.trim()}` : ''}`)
          await store.setStatus(prospect, 'contacte', { channel, video_url: video.trim() || null })
        }}
      >
        <Field label="Canal utilisé">
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            {Object.entries(CHANNELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lien de la vidéo (optionnel)">
          <input className="input" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Note (optionnel)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="A décroché, m'a dit de lui envoyer sur WhatsApp…" />
        </Field>
        <p className="text-xs text-slate-500">Trois relances seront créées automatiquement (J+3, J+7, J+14). Une réponse les annule.</p>
      </DialogForm>
    </Dialog>
  )
}

function ResponseDialog({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: Prospect }) {
  const store = useStore()
  const [text, setText] = useState('')
  return (
    <Dialog open={open} onClose={onClose} title="Réponse reçue">
      <DialogForm
        onCancel={onClose}
        submitLabel="Enregistrer"
        onSubmit={async () => {
          await store.markResponse(prospect, text.trim() || 'A répondu')
          setText('')
        }}
      >
        <Field label="Qu'a-t-il dit ?" hint="Les relances en attente sont annulées. Choisis ensuite RDV, devis ou perdu.">
          <textarea className="input min-h-24" value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Intéressé, veut qu'on se voie mardi…" />
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function RdvDialog({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: Prospect }) {
  const store = useStore()
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')
  return (
    <Dialog open={open} onClose={onClose} title="Rendez-vous pris">
      <DialogForm
        onCancel={onClose}
        submitLabel="Planifier"
        onSubmit={() => store.setStatus(prospect, 'rdv', { meeting_at: new Date(when).toISOString() }, note.trim() || undefined)}
      >
        <Field label="Date et heure">
          <input className="input" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Note (optionnel)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sur place, au resto, après le service" />
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function AmountDialog({ open, onClose, title, initial, onSubmit }: { open: boolean; onClose: () => void; title: string; initial: number; onSubmit: (amount: number) => Promise<void> }) {
  const [amount, setAmount] = useState(String(initial))
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <DialogForm onCancel={onClose} submitLabel="Valider" onSubmit={() => onSubmit(Number(amount) || 0)}>
        <Field label="Montant (€, hors abonnement)">
          <input className="input" type="number" min={0} step={10} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function LostDialog({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: Prospect }) {
  const store = useStore()
  const [reason, setReason] = useState<LostReason>('sans_reponse')
  const [note, setNote] = useState('')
  return (
    <Dialog open={open} onClose={onClose} title="Marquer comme perdu">
      <DialogForm onCancel={onClose} submitLabel="Confirmer" onSubmit={() => store.setStatus(prospect, 'perdu', { lost_reason: reason }, note.trim() || undefined)}>
        <Field label="Motif" hint="C'est ce qui vous dira quoi changer dans l'approche.">
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value as LostReason)}>
            {Object.entries(LOST_REASONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Détail (optionnel)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function StatusDialog({ open, onClose, prospect }: { open: boolean; onClose: () => void; prospect: Prospect }) {
  const store = useStore()
  const [status, setStatus] = useState<Status>(prospect.status)
  return (
    <Dialog open={open} onClose={onClose} title="Changer le statut">
      <DialogForm onCancel={onClose} submitLabel="Appliquer" onSubmit={() => (status === prospect.status ? Promise.resolve() : store.setStatus(prospect, status))}>
        <Field label="Nouveau statut" hint="Les automatismes du statut s'appliquent (tâches, notifications).">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label} — {STATUS[s].hint}
              </option>
            ))}
          </select>
        </Field>
      </DialogForm>
    </Dialog>
  )
}

function TaskDialog({ open, onClose, prospectId, defaultAssignee, profiles }: { open: boolean; onClose: () => void; prospectId: string; defaultAssignee: string; profiles: { id: string; name: string }[] }) {
  const store = useStore()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('autre')
  const [due, setDue] = useState(todayStr())
  const [assignee, setAssignee] = useState(defaultAssignee)
  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle tâche">
      <DialogForm
        onCancel={onClose}
        submitLabel="Ajouter"
        onSubmit={async () => {
          await store.addTask(prospectId, assignee, type, title.trim(), due)
          setTitle('')
        }}
      >
        <Field label="Titre">
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Rappeler après 14h" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {Object.entries(TASK_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Échéance">
            <input className="input" type="date" required value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Pour">
            <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </DialogForm>
    </Dialog>
  )
}
