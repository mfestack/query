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
      // DevTools integration - no console logs needed
    },

    onQueryRemoved(_query) {
      // DevTools integration - no console logs needed
    },

    onQueryUpdated(_query) {
      // DevTools integration - no console logs needed
    },

    onMutationAdded(_mutation) {
      // DevTools integration - no console logs needed
    },

    onMutationRemoved(_mutation) {
      // DevTools integration - no console logs needed
    },

    onMutationUpdated(_mutation) {
      // DevTools integration - no console logs needed
    },

    onCacheUpdate() {
      // DevTools integration - no console logs needed
    },

    dispose() {
      if (typeof window !== 'undefined') {
        delete (window as any).__APPSTACK_QUERY_CLIENT__
        delete (window as any).__APPSTACK_QUERY_DEVTOOLS__
      }
    },
  }
}
