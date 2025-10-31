
interface MutationItem {
  mutationHash?: string
  mutationKey?: any
  status: string
  isPending: boolean
  error?: Error
  data?: unknown
  submittedAt?: number
}

interface MutationsPanelProps {
  mutations: MutationItem[]
  selectedIndex?: number | null
  onSelectIndex?: (index: number | null) => void
}

function safeStringifyKey(key: any): string {
  try {
    return typeof key === 'string' ? key : JSON.stringify(key)
  } catch {
    return String(key)
  }
}

export function MutationsPanel({ mutations, selectedIndex = null, onSelectIndex }: MutationsPanelProps) {
  if (mutations.length === 0) {
    return (
      <div className="appstack-devtools-empty">
        <p>No mutations found</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#22c55e'
      case 'error':
        return '#ef4444'
      case 'pending':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  return (
    <div className="appstack-devtools-mutations">
      <div className="appstack-devtools-table">
        <table>
          <thead>
            <tr>
              <th>Mutation Key</th>
              <th>Status</th>
              <th>Pending</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {mutations.map((mutation, index) => {
              const keyString = mutation.mutationKey
                ? safeStringifyKey(mutation.mutationKey)
                : '<anonymous>'
              const isSelected = selectedIndex === index
              return (
              <tr
                key={mutation.mutationHash || index}
                className={isSelected ? 'selected' : ''}
                onClick={() => onSelectIndex?.(isSelected ? null : index)}
                style={{ cursor: 'pointer' }}
              >
                  <td>
                    <code className="appstack-devtools-query-key">
                      {keyString.length > 50
                        ? `${keyString.substring(0, 50)}...`
                        : keyString}
                    </code>
                  </td>
                  <td>
                    <span
                      className="appstack-devtools-status"
                      style={{ color: getStatusColor(mutation.status) }}
                    >
                      {mutation.status}
                    </span>
                  </td>
                <td>{mutation.isPending ? '✓' : '✗'}</td>
                  <td>
                    {mutation.error ? (
                      <span className="appstack-devtools-error">
                        {mutation.error.message || 'Error'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

