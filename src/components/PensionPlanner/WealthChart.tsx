import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import type { PensionResult, MonteCarloResult, LifeEvent } from '../../types'

interface Props {
  result: PensionResult
  mc: MonteCarloResult
  retirementAge: number
  showMonteCarlo: boolean
  lifeEvents: LifeEvent[]
  currentAge: number
}

function formatEur(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`
  return `€${v.toFixed(0)}`
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">Leeftijd {label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="text-slate-700 font-mono">{formatEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function WealthChart({ result, mc, retirementAge, showMonteCarlo, lifeEvents, currentAge }: Props) {
  const currentYear = new Date().getFullYear()

  // Convert life event calendar years to ages for reference lines
  const eventMarkers = (lifeEvents ?? []).map(e => ({
    age: currentAge + (e.year - currentYear),
    amount: e.amount,
    name: e.name,
    year: e.year,
    isExpense: e.amount < 0,
  })).filter(e => e.age > currentAge)

  // Build combined dataset aligning year data with MC percentiles
  const data = result.yearData.map(yd => {
    const mcPoint = mc.percentileData.find(p => p.age === yd.age)
    return {
      age: yd.age,
      vermogen: Math.max(0, yd.capital),
      p10: mcPoint ? Math.max(0, mcPoint.p10) : 0,
      // Stacked bands: base=p10, then deltas
      band1: mcPoint ? Math.max(0, mcPoint.p25 - mcPoint.p10) : 0,
      band2: mcPoint ? Math.max(0, mcPoint.p50 - mcPoint.p25) : 0,
      band3: mcPoint ? Math.max(0, mcPoint.p75 - mcPoint.p50) : 0,
      band4: mcPoint ? Math.max(0, mcPoint.p90 - mcPoint.p75) : 0,
    }
  })

  const maxVal = Math.max(...data.map(d => d.p10 + d.band1 + d.band2 + d.band3 + d.band4), ...data.map(d => d.vermogen))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradVermogen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="age"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Leeftijd', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          tickFormatter={formatEur}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          domain={[0, Math.ceil(maxVal * 1.05)]}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />

        {showMonteCarlo && (
          <>
            <Area dataKey="p10" stackId="mc" fill="transparent" stroke="none" name="P10" />
            <Area dataKey="band1" stackId="mc" fill="#bfdbfe" stroke="none" fillOpacity={0.6} name="P10–P25" />
            <Area dataKey="band2" stackId="mc" fill="#93c5fd" stroke="none" fillOpacity={0.5} name="P25–P50" />
            <Area dataKey="band3" stackId="mc" fill="#60a5fa" stroke="none" fillOpacity={0.4} name="P50–P75" />
            <Area dataKey="band4" stackId="mc" fill="#3b82f6" stroke="none" fillOpacity={0.3} name="P75–P90" />
          </>
        )}

        <Area
          dataKey="vermogen"
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="url(#gradVermogen)"
          dot={false}
          name="Prognose"
          activeDot={{ r: 4, fill: '#2563eb' }}
        />

        <ReferenceLine
          x={retirementAge}
          stroke="#64748b"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{ value: 'Pensioendatum', position: 'top', fontSize: 10, fill: '#64748b' }}
        />

        {/* Life event markers: green for income, red for expenses */}
        {eventMarkers.map(e => (
          <ReferenceLine
            key={`${e.year}-${e.name}`}
            x={e.age}
            stroke={e.isExpense ? '#ef4444' : '#10b981'}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{
              value: `${e.isExpense ? '−' : '+'}€${(Math.abs(e.amount) / 1000).toFixed(0)}k`,
              position: 'top',
              fontSize: 9,
              fill: e.isExpense ? '#dc2626' : '#059669',
            }}
          />
        ))}

        <Legend
          wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
