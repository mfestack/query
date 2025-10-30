// DevToolsPlugin - Integrates with browser DevTools
import type { AppStackPlugin, DevToolsPluginOptions } from '../types'

export function devtoolsPlugin(options: DevToolsPluginOptions = {}): AppStackPlugin {
  const {
    name = 'AppStack Query',
    enabled = process.env.NODE_ENV === 'development',
  } = options

  if (!enabled) {
    return {
      id: 'devtools',
      onInit: () => {
        // Do nothing when disabled
      },
      dispose: () => {
        // Do nothing when disabled
      },
      onQueryAdded: () => {},
      onQueryRemoved: () => {},
      onQueryUpdated: () => {},
      onMutationAdded: () => {},
      onMutationRemoved: () => {},
      onMutationUpdated: () => {},
      onCacheUpdate: () => {},
    }
  }

  return {
    id: 'devtools',
    
    onInit(_client) {
      // Expose client to global for DevTools
      if (typeof window !== 'undefined') {
        (window as any).__APPSTACK_QUERY_CLIENT__ = _client as any
        (window as any).__APPSTACK_QUERY_DEVTOOLS__ = {
          client: _client,
          version: '0.1.0',
          name,
        }
      }
    },

    onQueryAdded(_query) {
      // Send query data to DevTools
      console.log('Query added')
    },

    onQueryRemoved(_query) {
      console.log('Query removed')
    },

    onQueryUpdated(_query) {
      console.log('Query updated')
    },

    onMutationAdded(_mutation) {
      console.log('Mutation added')
    },

    onMutationRemoved(_mutation) {
      console.log('Mutation removed')
    },

    onMutationUpdated(_mutation) {
      console.log('Mutation updated')
    },

    onCacheUpdate() {
      console.log('Cache updated')
    },

    dispose() {
      if (typeof window !== 'undefined') {
        delete (window as any).__APPSTACK_QUERY_CLIENT__
        delete (window as any).__APPSTACK_QUERY_DEVTOOLS__
      }
    },
  }
}
