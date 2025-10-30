// Plugin system types for AppStack Query

import type {
  QueryClient,
  Query,
  Mutation,
  DehydratedState,
  Logger,
} from './clientTypes';
import type { QueryCache } from '../query/QueryCache';

export interface AppStackPlugin {
  id: string;
  onInit?: (client: QueryClient) => void;
  onQueryAdded?: (query: Query) => void;
  onQueryRemoved?: (query: Query) => void;
  onQueryUpdated?: (query: Query) => void;
  onMutationAdded?: (mutation: Mutation) => void;
  onMutationRemoved?: (mutation: Mutation) => void;
  onMutationUpdated?: (mutation: Mutation) => void;
  onMutationSuccess?: (mutation: Mutation, data: unknown) => void;
  onMutationError?: (mutation: Mutation, error: Error) => void;
  onCacheUpdate?: (cache: QueryCache) => void;
  onHydrate?: (client: QueryClient, state: DehydratedState) => void;
  onDehydrate?: (client: QueryClient) => DehydratedState | void;
  onPersist?: (client: QueryClient, state: DehydratedState) => void;
  onRestore?: (client: QueryClient, state: DehydratedState) => void;
  dispose?: () => void;
}

export interface PluginLifecycle {
  onInit: (client: QueryClient) => void;
  onQueryAdded: (query: Query) => void;
  onQueryRemoved: (query: Query) => void;
  onQueryUpdated: (query: Query) => void;
  onMutationAdded: (mutation: Mutation) => void;
  onMutationRemoved: (mutation: Mutation) => void;
  onMutationUpdated: (mutation: Mutation) => void;
  onMutationSuccess: (mutation: Mutation, data: unknown) => void;
  onMutationError: (mutation: Mutation, error: Error) => void;
  onCacheUpdate: (cache: QueryCache) => void;
  onHydrate: (client: QueryClient, state: DehydratedState) => void;
  onDehydrate: (client: QueryClient) => DehydratedState | void;
  onPersist: (client: QueryClient, state: DehydratedState) => void;
  onRestore: (client: QueryClient, state: DehydratedState) => void;
  dispose: () => void;
}

export interface PluginManager {
  plugins: Map<string, AppStackPlugin>;
  register: (plugin: AppStackPlugin) => void;
  unregister: (pluginId: string) => void;
  notify: (event: PluginEvent) => void;
  dispose: () => void;
}

export type PluginEvent =
  | { type: 'init'; client: QueryClient }
  | { type: 'queryAdded'; query: Query }
  | { type: 'queryRemoved'; query: Query }
  | { type: 'queryUpdated'; query: Query }
  | { type: 'mutationAdded'; mutation: Mutation }
  | { type: 'mutationRemoved'; mutation: Mutation }
  | { type: 'mutationUpdated'; mutation: Mutation }
  | { type: 'mutationSuccess'; mutation: Mutation; data: unknown }
  | { type: 'mutationError'; mutation: Mutation; error: Error }
  | { type: 'cacheUpdate'; cache: QueryCache }
  | { type: 'hydrate'; client: QueryClient; state: DehydratedState }
  | { type: 'dehydrate'; client: QueryClient; state: DehydratedState }
  | { type: 'persist'; client: QueryClient; state: DehydratedState }
  | { type: 'restore'; client: QueryClient; state: DehydratedState }
  | { type: 'dispose' };

// Built-in plugin types
export interface PersistPluginOptions {
  storage: Storage;
  key?: string;
  maxAge?: number;
  serialize?: (data: unknown) => string;
  deserialize?: (data: string) => unknown;
}

export interface BroadcastPluginOptions {
  channel?: string;
  serialize?: (data: unknown) => string;
  deserialize?: (data: string) => unknown;
}

export interface LoggerPluginOptions {
  level?: 'log' | 'warn' | 'error';
  prefix?: string;
  logger?: Logger;
}

export interface DevToolsPluginOptions {
  name?: string;
  enabled?: boolean;
}
