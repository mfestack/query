import { useState, useMemo } from 'react'

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

interface QueriesPanelProps {
  queries: Query[]
  actions?: {
    refetchQuery: (queryKey: string) => void
    invalidateQuery: (queryKey: string) => void
    removeQuery: (queryKey: string) => void
  }
  hideDisabledQueries?: boolean
  selectedQueryHash?: string | null
  onSelectQuery?: (queryHash: string | null) => void
}

type SortFn = 'status' | 'lastUpdated' | 'queryHash'
type SortOrder = 1 | -1

function safeStringifyKey(key: any): string {
  try {
    return typeof key === 'string' ? key : JSON.stringify(key)
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

function sortQueries(queries: Query[], sortFn: SortFn, sortOrder: SortOrder): Query[] {
  const sorted = [...queries]
  
  switch (sortFn) {
    case 'status': {
      const getRank = (q: Query) => {
        const label = getQueryStatusLabel(q)
        if (label === 'fetching') return 0
        if (label === 'error') return 1
        if (label === 'stale') return 2
        if (label === 'fresh') return 3
        return 4
      }
      sorted.sort((a, b) => {
        const rankDiff = getRank(a) - getRank(b)
        if (rankDiff !== 0) return rankDiff * sortOrder
        return (a.dataUpdatedAt - b.dataUpdatedAt) * sortOrder
      })
      break
    }
    case 'lastUpdated':
      sorted.sort((a, b) => (a.dataUpdatedAt - b.dataUpdatedAt) * sortOrder)
      break
    case 'queryHash':
      sorted.sort((a, b) => {
        const aKey = safeStringifyKey(a.queryKey)
        const bKey = safeStringifyKey(b.queryKey)
        return aKey.localeCompare(bKey) * sortOrder
      })
      break
  }
  
  return sorted
}

function filterQueries(queries: Query[], filter: string): Query[] {
  if (!filter.trim()) return queries
  const filterLower = filter.toLowerCase()
  return queries.filter(q => {
    const keyString = safeStringifyKey(q.queryKey).toLowerCase()
    return keyString.includes(filterLower)
  })
}

export function QueriesPanel({
  queries,
  hideDisabledQueries = false,
  selectedQueryHash,
  onSelectQuery,
}: QueriesPanelProps) {
  const [filter, setFilter] = useState('')
  const [sortFn, setSortFn] = useState<SortFn>('status')
  const [sortOrder, setSortOrder] = useState<SortOrder>(-1)

  // Filter queries
  let filteredQueries = useMemo(() => {
    let result = hideDisabledQueries
      ? queries.filter(q => q.status !== 'idle')
      : queries
    
    result = filterQueries(result, filter)
    return sortQueries(result, sortFn, sortOrder)
  }, [queries, filter, sortFn, sortOrder, hideDisabledQueries])

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      fetching: 0,
      fresh: 0,
      stale: 0,
      error: 0,
      inactive: 0,
    }
    queries.forEach(q => {
      const label = getQueryStatusLabel(q)
      counts[label]++
    })
    return counts
  }, [queries])

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 1 ? -1 : 1) as SortOrder)
  }

  return (
    <div className="appstack-devtools-queries">
      {/* Toolbar */}
      <div className="appstack-devtools-queries-toolbar">
        <div className="appstack-devtools-status-counts">
          <span className="appstack-devtools-status-count" style={{ color: '#3b82f6' }}>
            {statusCounts.fetching} fetching
          </span>
          <span className="appstack-devtools-status-count" style={{ color: '#22c55e' }}>
            {statusCounts.fresh} fresh
          </span>
          <span className="appstack-devtools-status-count" style={{ color: '#f59e0b' }}>
            {statusCounts.stale} stale
          </span>
          <span className="appstack-devtools-status-count" style={{ color: '#ef4444' }}>
            {statusCounts.error} error
          </span>
          <span className="appstack-devtools-status-count" style={{ color: '#6b7280' }}>
            {statusCounts.inactive} inactive
          </span>
        </div>
        
        <div className="appstack-devtools-filters">
          <div className="appstack-devtools-filter-input">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <circle cx="6" cy="6" r="4" />
              <path d="m10 10 4 4" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Filter queries"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appstack-devtools-filter-textfield"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="appstack-devtools-filter-clear"
                aria-label="Clear filter"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="appstack-devtools-filter-select">
            <select
              value={sortFn}
              onChange={(e) => setSortFn(e.target.value as SortFn)}
              className="appstack-devtools-sort-select"
            >
              <option value="status">Sort by status</option>
              <option value="lastUpdated">Sort by last updated</option>
              <option value="queryHash">Sort by query hash</option>
            </select>
            <button
              type="button"
              onClick={toggleSortOrder}
              className="appstack-devtools-sort-order"
              aria-label={`Sort ${sortOrder === 1 ? 'ascending' : 'descending'}`}
              title={`Sort ${sortOrder === 1 ? 'ascending' : 'descending'}`}
            >
              {sortOrder === 1 ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Query List */}
      <div className="appstack-devtools-queries-list">
        {filteredQueries.length === 0 ? (
          <div className="appstack-devtools-empty">
            <p>{filter ? 'No queries match your filter' : 'No queries found'}</p>
          </div>
        ) : (
          <div className="appstack-devtools-queries-scroll">
            {filteredQueries.map(query => {
              const keyString = safeStringifyKey(query.queryKey)
              const statusLabel = getQueryStatusLabel(query)
              const statusColor = getQueryStatusColor(statusLabel)
              const isSelected = selectedQueryHash === query.queryHash

              return (
                <button
                  key={query.queryHash}
                  type="button"
                  className={`appstack-devtools-query-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectQuery?.(isSelected ? null : query.queryHash)}
                >
                  <div 
                    className="appstack-devtools-query-status-dot"
                    style={{ backgroundColor: statusColor }}
                    title={statusLabel}
                  />
                  <code className="appstack-devtools-query-hash">
                    {keyString}
                  </code>
                  <div className="appstack-devtools-query-meta">
                    {query.isFetching && (
                      <span className="appstack-devtools-query-badge fetching">fetching</span>
                    )}
                    {query.isStale && !query.isFetching && (
                      <span className="appstack-devtools-query-badge stale">stale</span>
                    )}
                    {query.status === 'error' && (
                      <span className="appstack-devtools-query-badge error">error</span>
                    )}
                    <span className="appstack-devtools-query-time">
                      {query.dataUpdatedAt
                        ? new Date(query.dataUpdatedAt).toLocaleTimeString()
                        : 'Never'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
