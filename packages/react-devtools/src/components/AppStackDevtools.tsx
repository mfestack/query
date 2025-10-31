import React, { useEffect } from 'react'
import { useQueryClient } from '@mfestack/react'
import { useDevTools } from '../hooks/useDevTools'
import { DevToolsPanel } from './DevToolsPanel'
import { DevToolsButton } from './DevToolsButton'
import './styles.css'

export interface AppStackDevtoolsProps {
  /**
   * Custom instance of QueryClient
   */
  client?: any
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * Defaults to 'bottom'.
   */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /**
   * The position of the toggle button.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * Defaults to 'bottom-right'.
   */
  buttonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /**
   * Set to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
}

export function AppStackDevtools({
  client,
  initialIsOpen = false,
  position = 'bottom',
  buttonPosition = 'bottom-right',
  hideDisabledQueries = false,
}: AppStackDevtoolsProps): React.ReactElement | null {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const defaultQueryClient = useQueryClient()
  const queryClient = client || defaultQueryClient
  const devTools = useDevTools(queryClient)

  useEffect(() => {
    if (initialIsOpen) {
      devTools.setIsOpen(true)
    }
  }, [initialIsOpen])

  return (
    <>
      <DevToolsButton
        onClick={() => devTools.setIsOpen(!devTools.isOpen)}
        position={buttonPosition}
        isOpen={devTools.isOpen}
      />
      {devTools.isOpen && (
        <DevToolsPanel
          devTools={devTools}
          position={position}
          hideDisabledQueries={hideDisabledQueries}
        />
      )}
    </>
  )
}

