import { DataExplorer } from './DataExplorer'

interface MutationItem {
  mutationHash?: string
  mutationKey?: any
  status: string
  isPending: boolean
  error?: Error
  data?: unknown
  submittedAt?: number
}

interface MutationDetailsProps {
  mutation: MutationItem | null
}

function safeStringifyKey(key: any): string {
  try {
    return typeof key === 'string' ? key : JSON.stringify(key, null, 2)
  } catch {
    return String(key)
  }
}

export function MutationDetails({ mutation }: MutationDetailsProps) {
  if (!mutation) {
    return (
      <div className="appstack-devtools-query-details appstack-devtools-query-details-empty">
        <p>Select a mutation to view details</p>
      </div>
    )
  }

  const keyString = mutation.mutationKey ? safeStringifyKey(mutation.mutationKey) : '<anonymous>'

  return (
    <div className="appstack-devtools-query-details">
      <div className="appstack-devtools-query-details-header">
        <div className="appstack-devtools-query-details-title">Mutation Details</div>
      </div>

      <div className="appstack-devtools-query-details-content">
        <div className="appstack-devtools-query-details-section">
          <h3>Mutation Key</h3>
          <pre className="appstack-devtools-query-key-display">
            <code>{keyString}</code>
          </pre>
        </div>

        <div className="appstack-devtools-query-details-section">
          <h3>Status</h3>
          <div className="appstack-devtools-query-status-info">
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Status:</span>
              <span className="appstack-devtools-status-value">{mutation.status}</span>
            </div>
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Pending:</span>
              <span className="appstack-devtools-status-value">{mutation.isPending ? 'Yes' : 'No'}</span>
            </div>
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Submitted At:</span>
              <span className="appstack-devtools-status-value">
                {mutation.submittedAt ? new Date(mutation.submittedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {mutation.error && (
          <div className="appstack-devtools-query-details-section">
            <h3>Error</h3>
            <div className="appstack-devtools-error-display">
              <pre>{mutation.error.message || String(mutation.error)}</pre>
            </div>
          </div>
        )}

        <div className="appstack-devtools-query-details-section">
          <h3>Data</h3>
          <div className="appstack-devtools-query-data-explorer">
            {mutation.data !== undefined ? (
              <DataExplorer value={mutation.data} />
            ) : (
              <div className="appstack-devtools-empty-data">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
