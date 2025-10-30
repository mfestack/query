// PluginManager - Manages plugin lifecycle and events
import type { AppStackPlugin, PluginEvent } from '../types'

export class PluginManager {
  private plugins = new Map<string, AppStackPlugin>()

  constructor() {}

  register(plugin: AppStackPlugin) {
    this.plugins.set(plugin.id, plugin)
  }

  unregister(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.dispose?.()
      this.plugins.delete(pluginId)
    }
  }

  notify(event: PluginEvent) {
    this.plugins.forEach(plugin => {
      try {
        switch (event.type) {
          case 'init':
            plugin.onInit?.(event.client)
            break
          case 'queryAdded':
            plugin.onQueryAdded?.(event.query)
            break
          case 'queryRemoved':
            plugin.onQueryRemoved?.(event.query)
            break
          case 'queryUpdated':
            plugin.onQueryUpdated?.(event.query)
            break
          case 'mutationAdded':
            plugin.onMutationAdded?.(event.mutation)
            break
          case 'mutationRemoved':
            plugin.onMutationRemoved?.(event.mutation)
            break
          case 'mutationUpdated':
            plugin.onMutationUpdated?.(event.mutation)
            break
          case 'mutationSuccess':
            plugin.onMutationSuccess?.(event.mutation, event.data)
            break
          case 'mutationError':
            plugin.onMutationError?.(event.mutation, event.error)
            break
          case 'cacheUpdate':
            plugin.onCacheUpdate?.(event.cache)
            break
          case 'hydrate':
            plugin.onHydrate?.(event.client, event.state)
            break
          case 'dehydrate':
            plugin.onDehydrate?.(event.client)
            break
          case 'persist':
            plugin.onPersist?.(event.client, event.state)
            break
          case 'restore':
            plugin.onRestore?.(event.client, event.state)
            break
          case 'dispose':
            plugin.dispose?.()
            break
        }
      } catch (error) {
        console.error(`Plugin ${plugin.id} error in ${event.type}:`, error)
      }
    })
  }

  dispose() {
    this.plugins.forEach(plugin => {
      plugin.dispose?.()
    })
    this.plugins.clear()
  }

  getPlugins() {
    return this.plugins
  }

  notifyQueryAdded(query: any): void {
    this.plugins.forEach(plugin => {
      plugin.onQueryAdded?.(query)
    })
  }

  notifyQueryRemoved(query: any): void {
    this.plugins.forEach(plugin => {
      plugin.onQueryRemoved?.(query)
    })
  }

  notifyQueryUpdated(query: any): void {
    this.plugins.forEach(plugin => {
      plugin.onQueryUpdated?.(query)
    })
  }

  notifyMutationAdded(mutation: any): void {
    this.plugins.forEach(plugin => {
      plugin.onMutationAdded?.(mutation)
    })
  }

  notifyMutationRemoved(mutation: any): void {
    this.plugins.forEach(plugin => {
      plugin.onMutationRemoved?.(mutation)
    })
  }

  notifyMutationUpdated(mutation: any): void {
    this.plugins.forEach(plugin => {
      plugin.onMutationUpdated?.(mutation)
    })
  }

  notifyCacheUpdate(cache: any): void {
    this.plugins.forEach(plugin => {
      plugin.onCacheUpdate?.(cache)
    })
  }
}
