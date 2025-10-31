import type { QueryClient, DefaultOptions, AppStackPlugin } from '../types'

export type QueryClientScope = string | symbol

/**
 * Policy for a scope: defaultOptions and plugins that apply to all clients in that scope
 */
export interface ScopePolicy {
  defaultOptions?: DefaultOptions
  plugins?: AppStackPlugin[]
}

class Registry {
  private scopeToClient = new Map<QueryClientScope, QueryClient>()
  private scopeToPolicy = new Map<QueryClientScope, ScopePolicy>()

  has(scope: QueryClientScope): boolean {
    return this.scopeToClient.has(scope)
  }

  register(scope: QueryClientScope, client: QueryClient, policy?: ScopePolicy): void {
    this.scopeToClient.set(scope, client)
    
    // Apply policy if provided
    if (policy) {
      this.setPolicy(scope, policy)
    }
    
    // Apply existing policy to new client if one exists
    const existingPolicy = this.scopeToPolicy.get(scope)
    if (existingPolicy) {
      this.applyPolicy(client, existingPolicy)
    }
  }

  get(scope: QueryClientScope): QueryClient | undefined {
    return this.scopeToClient.get(scope)
  }

  remove(scope: QueryClientScope): void {
    this.scopeToClient.delete(scope)
    this.scopeToPolicy.delete(scope)
  }

  clear(): void {
    this.scopeToClient.clear()
    this.scopeToPolicy.clear()
  }

  listScopes(): QueryClientScope[] {
    return Array.from(this.scopeToClient.keys())
  }

  /**
   * Set policy for a scope. Applies to existing client if registered.
   */
  setPolicy(scope: QueryClientScope, policy: ScopePolicy): void {
    this.scopeToPolicy.set(scope, policy)
    
    // Apply to existing client if registered
    const client = this.scopeToClient.get(scope)
    if (client) {
      this.applyPolicy(client, policy)
    }
  }

  /**
   * Get policy for a scope
   */
  getPolicy(scope: QueryClientScope): ScopePolicy | undefined {
    return this.scopeToPolicy.get(scope)
  }

  /**
   * Apply policy to a client
   */
  private applyPolicy(client: QueryClient, policy: ScopePolicy): void {
    // Apply defaultOptions
    if (policy.defaultOptions) {
      client.setDefaultOptions(policy.defaultOptions)
    }
    
    // Apply plugins
    if (policy.plugins) {
      policy.plugins.forEach(plugin => {
        client.use(plugin)
      })
    }
  }
}

export const ClientRegistry = new Registry()
