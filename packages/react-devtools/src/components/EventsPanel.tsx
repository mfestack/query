import type { TypedEvent, AppStackEvents } from '@mfestack/devtools-core'

interface EventsPanelProps {
  events: TypedEvent<keyof AppStackEvents>[]
}

export function EventsPanel({ events }: EventsPanelProps) {
  if (events.length === 0) {
    return (
      <div className="appstack-devtools-empty">
        <p>No events recorded</p>
        <p className="appstack-devtools-hint">
          Events will appear here as they occur in your application.
        </p>
      </div>
    )
  }

  const getEventColor = (type: string) => {
    if (type.startsWith('query:')) return '#3b82f6'
    if (type.startsWith('mutation:')) return '#8b5cf6'
    if (type.startsWith('cache:')) return '#f59e0b'
    return '#6b7280'
  }

  return (
    <div className="appstack-devtools-events">
      <div className="appstack-devtools-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Event Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {events
              .slice()
              .reverse()
              .map((event, index) => (
                <tr key={index}>
                  <td>
                    {(event as any).timestamp
                      ? new Date((event as any).timestamp).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td>
                    <span
                      className="appstack-devtools-event-type"
                      style={{ color: getEventColor(event.type) }}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td>
                    <details>
                      <summary>View payload</summary>
                      <pre className="appstack-devtools-payload">
                        {safeStringify((event as any).payload)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Safely stringify payloads with potential circular references and large objects
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()

  const replacer = (_key: string, val: any) => {
    if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`
    if (typeof val === 'symbol') return val.toString()
    if (val instanceof Error) {
      return { name: val.name, message: val.message, stack: val.stack }
    }
    if (val instanceof Date) return val.toISOString()
    if (val instanceof Map) return { __type: 'Map', value: Array.from(val.entries()) }
    if (val instanceof Set) return { __type: 'Set', value: Array.from(val.values()) }

    if (val && typeof val === 'object') {
      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      // Compact known large structures from core objects
      // Query-like object
      if (val.queryHash && val.queryKey) {
        return { queryHash: val.queryHash, queryKey: val.queryKey }
      }
      // Mutation-like object
      if (val.mutationHash || val.mutationKey) {
        return {
          mutationHash: val.mutationHash,
          mutationKey: val.mutationKey,
          status: val.state?.status,
        }
      }
      // Query observer / references can create cycles
      if (val.currentQuery && val.observers) {
        return {
          currentQuery: val.currentQuery?.queryHash || '[Query]'
        }
      }
    }
    return val
  }

  try {
    return JSON.stringify(value, replacer, 2)
  } catch {
    try {
      return String(value)
    } catch {
      return '[Unserializable]'
    }
  }
}
