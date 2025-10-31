
interface CachePanelProps {
  queries: Array<{
    queryKey: any
    queryHash: string
    status: string
    data?: unknown
  }>
  mutations: Array<{
    mutationKey?: any
    status: string
    data?: unknown
  }>
  actions: {
    clearCache: () => void
  }
}

export function CachePanel({ queries, mutations, actions }: CachePanelProps) {
  const stats = {
    totalQueries: queries.length,
    activeQueries: queries.filter(q => q.status === 'success').length,
    errorQueries: queries.filter(q => q.status === 'error').length,
    totalMutations: mutations.length,
    activeMutations: mutations.filter(m => m.status === 'pending').length,
  }

  return (
    <div className="appstack-devtools-cache">
      <div className="appstack-devtools-stats">
        <div className="appstack-devtools-stat-card">
          <h3>Cache Statistics</h3>
          <div className="appstack-devtools-stat-grid">
            <div className="appstack-devtools-stat-item">
              <span className="stat-label">Total Queries:</span>
              <span className="stat-value">{stats.totalQueries}</span>
            </div>
            <div className="appstack-devtools-stat-item">
              <span className="stat-label">Active Queries:</span>
              <span className="stat-value">{stats.activeQueries}</span>
            </div>
            <div className="appstack-devtools-stat-item">
              <span className="stat-label">Error Queries:</span>
              <span className="stat-value error">{stats.errorQueries}</span>
            </div>
            <div className="appstack-devtools-stat-item">
              <span className="stat-label">Total Mutations:</span>
              <span className="stat-value">{stats.totalMutations}</span>
            </div>
            <div className="appstack-devtools-stat-item">
              <span className="stat-label">Pending Mutations:</span>
              <span className="stat-value">{stats.activeMutations}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="appstack-devtools-actions-bar">
        <button
          onClick={actions.clearCache}
          className="appstack-devtools-clear-btn"
          type="button"
        >
          Clear Cache
        </button>
      </div>
    </div>
  )
}

