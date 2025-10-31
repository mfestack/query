import { DataExplorer } from './DataExplorer'

interface Query {
  queryKey: any
  queryHash: string
  status: string
  dataUpdatedAt: number
  error?: Error
  isFetching: boolean
  isStale: boolean
  data?: unknown
}

interface QueryDetailsProps {
  query: Query | null
  actions: {
    refetchQuery: (queryKey: string) => void
    invalidateQuery: (queryKey: string) => void
    removeQuery: (queryKey: string) => void
  }
}

function safeStringifyKey(key: any): string {
  try {
    return typeof key === 'string' ? key : JSON.stringify(key, null, 2)
  } catch {
    return String(key)
  }
}

function getQueryStatusLabel(query: Query): 'fresh' | 'stale' | 'fetching' | 'inactive' | 'error' {
  if (query.isFetching) return 'fetching'
  if (query.status === 'error') return 'error'
  if (query.isStale) return 'stale'
  if (query.status === 'success') return 'fresh'
  return 'inactive'
}

function getQueryStatusColor(label: ReturnType<typeof getQueryStatusLabel>): string {
  switch (label) {
    case 'fresh':
      return '#22c55e'
    case 'stale':
      return '#f59e0b'
    case 'fetching':
      return '#3b82f6'
    case 'error':
      return '#ef4444'
    case 'inactive':
      return '#6b7280'
  }
}

export function QueryDetails({ query, actions }: QueryDetailsProps) {
  if (!query) {
    return (
      <div className="appstack-devtools-query-details-empty">
        <p>Select a query to view details</p>
      </div>
    )
  }

  const statusLabel = getQueryStatusLabel(query)
  const statusColor = getQueryStatusColor(statusLabel)
  const keyString = safeStringifyKey(query.queryKey)

  const handleRefetch = () => {
    try {
      const key = typeof query.queryKey === 'string' ? query.queryKey : JSON.stringify(query.queryKey)
      actions.refetchQuery(key)
    } catch (e) {
      console.error('Failed to refetch query', e)
    }
  }

  const handleInvalidate = () => {
    try {
      const key = typeof query.queryKey === 'string' ? query.queryKey : JSON.stringify(query.queryKey)
      actions.invalidateQuery(key)
    } catch (e) {
      console.error('Failed to invalidate query', e)
    }
  }

  const handleRemove = () => {
    try {
      const key = typeof query.queryKey === 'string' ? query.queryKey : JSON.stringify(query.queryKey)
      actions.removeQuery(key)
    } catch (e) {
      console.error('Failed to remove query', e)
    }
  }

  return (
    <div className="appstack-devtools-query-details">
      <div className="appstack-devtools-query-details-header">
        <div className="appstack-devtools-query-details-title">
          <div 
            className="appstack-devtools-query-status-dot"
            style={{ backgroundColor: statusColor }}
          />
          <span>Query Details</span>
        </div>
        <div className="appstack-devtools-query-details-actions">
          <button
            type="button"
            onClick={handleRefetch}
            className="appstack-devtools-action-btn"
            title="Refetch query"
            disabled={query.isFetching}
          >
            🔄 Refetch
          </button>
          <button
            type="button"
            onClick={handleInvalidate}
            className="appstack-devtools-action-btn"
            title="Invalidate query"
          >
            ⚠️ Invalidate
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="appstack-devtools-action-btn"
            title="Remove query"
          >
            🗑️ Remove
          </button>
        </div>
      </div>

      <div className="appstack-devtools-query-details-content">
        <div className="appstack-devtools-query-details-section">
          <h3>Query Key</h3>
          <pre className="appstack-devtools-query-key-display">
            <code>{keyString}</code>
          </pre>
        </div>

        <div className="appstack-devtools-query-details-section">
          <h3>Status</h3>
          <div className="appstack-devtools-query-status-info">
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Status:</span>
              <span 
                className="appstack-devtools-status-value"
                style={{ color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Fetching:</span>
              <span className="appstack-devtools-status-value">
                {query.isFetching ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Stale:</span>
              <span className="appstack-devtools-status-value">
                {query.isStale ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="appstack-devtools-status-item">
              <span className="appstack-devtools-status-label">Last Updated:</span>
              <span className="appstack-devtools-status-value">
                {query.dataUpdatedAt
                  ? new Date(query.dataUpdatedAt).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {query.error && (
          <div className="appstack-devtools-query-details-section">
            <h3>Error</h3>
            <div className="appstack-devtools-error-display">
              <pre>{query.error.message || String(query.error)}</pre>
              {query.error.stack && (
                <details>
                  <summary>Stack trace</summary>
                  <pre>{query.error.stack}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        <div className="appstack-devtools-query-details-section">
          <h3>Data</h3>
          <div className="appstack-devtools-query-data-explorer">
            {query.data !== undefined ? (
              <DataExplorer value={query.data} />
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

