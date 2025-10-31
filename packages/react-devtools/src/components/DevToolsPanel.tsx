import { useState } from 'react'
import { QueriesPanel } from './QueriesPanel'
import { QueryDetails } from './QueryDetails'
import { MutationsPanel } from './MutationsPanel'
import { MutationDetails } from './MutationDetails'
import { CachePanel } from './CachePanel'
import { EventsPanel } from './EventsPanel'
import type { useDevTools } from '../hooks/useDevTools'

interface DevToolsPanelProps {
  devTools: ReturnType<typeof useDevTools>
  position: 'top' | 'bottom' | 'left' | 'right'
  hideDisabledQueries?: boolean
}

export function DevToolsPanel({
  devTools,
  position,
  hideDisabledQueries = false,
}: DevToolsPanelProps) {
  const { setIsOpen, activeTab, setActiveTab, state } = devTools
  const [selectedQueryHash, setSelectedQueryHash] = useState<string | null>(null)
  const [selectedMutationIndex, setSelectedMutationIndex] = useState<number | null>(null)

  const positionClasses = {
    top: 'appstack-devtools-panel-top',
    bottom: 'appstack-devtools-panel-bottom',
    left: 'appstack-devtools-panel-left',
    right: 'appstack-devtools-panel-right',
  }

  const tabs = [
    { id: 'queries' as const, label: `Queries (${state.queries.length})` },
    { id: 'mutations' as const, label: `Mutations (${state.mutations.length})` },
    { id: 'cache' as const, label: 'Cache' },
    { id: 'events' as const, label: `Events (${state.events.length})` },
  ]

  const selectedQuery = selectedQueryHash
    ? state.queries.find(q => q.queryHash === selectedQueryHash) || null
    : null

  const selectedMutation =
    selectedMutationIndex != null ? state.mutations[selectedMutationIndex] || null : null

  // Reset selected query when switching tabs
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab !== 'queries') {
      setSelectedQueryHash(null)
    }
    if (tab !== 'mutations') {
      setSelectedMutationIndex(null)
    }
  }

  return (
    <div className={`appstack-devtools-panel ${positionClasses[position]}`}>
      <div className="appstack-devtools-header">
        <div className="appstack-devtools-title">AppStack Query DevTools</div>
        <button
          className="appstack-devtools-close"
          onClick={() => setIsOpen(false)}
          aria-label="Close DevTools"
          type="button"
        >
          ×
        </button>
      </div>
      <div className="appstack-devtools-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`appstack-devtools-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="appstack-devtools-content">
        {activeTab === 'queries' && (
          <div className="appstack-devtools-queries-split">
            <QueriesPanel
              queries={state.queries}
              actions={devTools.actions}
              hideDisabledQueries={hideDisabledQueries}
              selectedQueryHash={selectedQueryHash}
              onSelectQuery={setSelectedQueryHash}
            />
            <QueryDetails
              query={selectedQuery}
              actions={devTools.actions}
            />
          </div>
        )}
        {activeTab === 'mutations' && (
          <div className="appstack-devtools-queries-split">
            <MutationsPanel
              mutations={state.mutations}
              selectedIndex={selectedMutationIndex}
              onSelectIndex={setSelectedMutationIndex}
            />
            <MutationDetails mutation={selectedMutation} />
          </div>
        )}
        {activeTab === 'cache' && (
          <CachePanel
            queries={state.queries}
            mutations={state.mutations}
            actions={devTools.actions}
          />
        )}
        {activeTab === 'events' && <EventsPanel events={state.events} />}
      </div>
    </div>
  )
}

