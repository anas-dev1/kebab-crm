import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { CLIENT_STAGES, CLIENT_STAGE_ORDER, MONTHLY_FEE } from '../lib/status'
import { ago } from '../lib/dates'
import type { ClientStage } from '../lib/types'
import { Avatar, Empty, PageTitle } from '../components/ui'

export function Clients() {
  const { prospects, profileOf, setClientStage } = useStore()
  const clients = prospects.filter((p) => p.status === 'gagne')
  const subscribed = clients.filter((p) => p.client_stage === 'abonne').length
  const oneShot = clients.reduce((sum, p) => sum + (p.quote_amount ?? 0), 0)

  return (
    <div>
      <PageTitle title="Clients" subtitle="Après la vente : éléments, production, mise en ligne, abonnement." />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold">{clients.length}</p>
          <p className="text-xs text-slate-500">Clients signés</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold">{oneShot.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-slate-500">Ventes (ponctuel)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold">{(subscribed * MONTHLY_FEE).toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-slate-500">Récurrent / mois ({subscribed} abonné{subscribed > 1 ? 's' : ''})</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Empty title="Pas encore de client." text="Dès qu'un prospect passe en Gagné, il apparaît ici." />
      ) : (
        <div className="grid gap-3 md:grid-cols-4">
          {CLIENT_STAGE_ORDER.map((stage) => {
            const items = clients.filter((p) => (p.client_stage ?? 'elements_a_recevoir') === stage)
            return (
              <div key={stage} className="rounded-xl bg-slate-200/60 p-2">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold">{CLIENT_STAGES[stage]}</span>
                  <span className="rounded-full bg-white px-2 text-xs font-medium text-slate-600">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((p) => (
                    <div key={p.id} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <Link to={`/prospects/${p.id}`} className="font-semibold hover:underline">
                        {p.business_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {p.city ?? ''} · {p.quote_amount != null ? `${p.quote_amount} €` : 'montant ?'} · {ago(p.updated_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar profile={profileOf(p.owner_id)} />
                        <select
                          className="input py-1 text-xs"
                          value={p.client_stage ?? 'elements_a_recevoir'}
                          onChange={(e) => void setClientStage(p, e.target.value as ClientStage)}
                        >
                          {CLIENT_STAGE_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {CLIENT_STAGES[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
