import { useMemo, useState } from 'react'

type NodeProps = {
  label: string
  value: unknown
  defaultExpanded?: boolean
}

function isIterable(x: any): x is Iterable<unknown> {
  return x != null && typeof x === 'object' && Symbol.iterator in x
}

function getEntries(value: unknown): Array<{ label: string; value: unknown }> {
  if (Array.isArray(value)) return value.map((v, i) => ({ label: String(i), value: v }))
  if (value instanceof Map) return Array.from(value, ([k, v]) => ({ label: String(k), value: v }))
  if (isIterable(value) && !(value instanceof Map)) return Array.from(value as Iterable<unknown>).map((v, i) => ({ label: String(i), value: v }))
  if (value !== null && typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ label: k, value: v }))
  return []
}

function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array'
  if (value instanceof Map) return 'map'
  if (isIterable(value)) return 'iterable'
  if (value !== null && typeof value === 'object') return 'object'
  return typeof value
}

function Primitive({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="as-explorer-row">
      <span className="as-explorer-key">{label}:</span>
      <span className="as-explorer-value">{String(value)}</span>
    </div>
  )
}

export function DataNode({ label, value, defaultExpanded }: NodeProps) {
  const [open, setOpen] = useState<boolean>(!!defaultExpanded)
  const entries = useMemo(() => getEntries(value), [value])
  const t = typeOf(value)
  const isBranch = entries.length > 0

  if (!isBranch) return <Primitive label={label} value={value} />

  return (
    <div className="as-explorer-branch">
      <button className="as-explorer-toggle" onClick={() => setOpen(v => !v)} type="button">
        <span className={`as-expander ${open ? 'open' : ''}`}>▶</span>
        <span className="as-explorer-key">{label}</span>
        <span className="as-explorer-info">{t} · {entries.length} {entries.length === 1 ? 'item' : 'items'}</span>
      </button>
      {open && (
        <div className="as-explorer-children">
          {entries.map(e => (
            <DataNode key={e.label} label={e.label} value={e.value} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DataExplorer({ value }: { value: unknown }) {
  return (
    <div className="as-explorer-root">
      <DataNode label="data" value={value} defaultExpanded />
    </div>
  )
}


