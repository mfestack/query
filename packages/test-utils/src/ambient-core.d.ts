declare module '@mfestack/core' {
  // Fallback ambient types for test-utils DTS build
  export type QueryClient = any
  export function createQueryClient(...args: any[]): any
}
