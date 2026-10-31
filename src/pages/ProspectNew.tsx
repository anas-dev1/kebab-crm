import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../data/store'
import { ProspectForm } from '../components/ProspectForm'
import { PageTitle } from '../components/ui'

export function ProspectNew() {
  const { prospects, createProspect } = useStore()
  const navigate = useNavigate()
  const niches = useMemo(() => Array.from(new Set(prospects.map((p) => p.niche).filter((n): n is string => !!n))).sort(), [prospects])

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Nouveau prospect" subtitle="Le minimum : le nom. Le reste peut venir après." />
      <div className="card p-5">
        <ProspectForm
          niches={niches}
          submitLabel="Ajouter au pipeline"
          onSubmit={async (values) => {
            const p = await createProspect(values)
            navigate(`/prospects/${p.id}`)
          }}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  )
}
