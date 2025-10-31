# 📊 MFestack Query Benchmarks

This directory contains comprehensive benchmarks for MFestack Query, including:

- **Bundle Size Budgets**: Enforced via `size-limit` to prevent bundle size regressions
- **Performance Benchmarks**: Measure operations per second for key operations
- **Tree-shaking Verification**: Ensures unused code is properly eliminated

## Quick Start

```bash
# Run all benchmarks
pnpm benchmark

# Run specific benchmark suite
pnpm benchmark:size      # Bundle size checks
pnpm benchmark:perf      # Performance tests
pnpm benchmark:treeshake # Tree-shaking verification
```

## Benchmark Suites

### 1. Bundle Size Budgets

**Command**: `pnpm benchmark:size`

Uses [size-limit](https://github.com/ai/size-limit) to enforce bundle size budgets. Configuration is in `.size-limit.json` at the root.

**Current Budgets**:
- `@mfestack/core` (ESM): 85 KB
- `@mfestack/core` (CJS): 90 KB
- `@mfestack/react` (ESM): 12 KB
- `@mfestack/react` (CJS): 13 KB
- `@mfestack/devtools-core` (ESM): 25 KB

**Usage in CI**:
```yaml
- run: pnpm benchmark:size
```

### 2. Performance Benchmarks

**Command**: `pnpm benchmark:perf`

Measures operations per second (ops/sec) for critical paths:

- **Query Creation & Cache Operations**: Creating queries, cache get/set/remove
- **BatchManager Performance**: Microtask and RAF batching throughput
- **TaskScheduler Performance**: Task scheduling overhead
- **Structural Sharing**: `replaceEqualDeep` performance for various object sizes
- **QueryObserver & Select Memoization**: Query observer and select memoization performance

**Output Format**:
```
┌─────────────────────────────────────┬──────────────────┬──────────────┬───────────┬───────────┐
│ Benchmark                          │ Ops/sec          │ Avg Time     │ Min       │ Max       │
├─────────────────────────────────────┼──────────────────┼──────────────┼───────────┼───────────┤
│ QueryClient.createQuery             │ 12,345 ops/sec   │ 81.00µs      │ 75.00µs   │ 120.00µs  │
└─────────────────────────────────────┴──────────────────┴──────────────┴───────────┴───────────┘
```

### 3. Tree-shaking Verification

**Command**: `pnpm benchmark:treeshake`

Verifies that tree-shaking is working correctly by:
1. Creating minimal import files
2. Bundling with esbuild (tree-shaking enabled)
3. Comparing bundle sizes against expected maximums

**Tests**:
- `QueryClient` only import
- `useQuery` hook only import
- `taskScheduler` only import
- `EventBus` only import

If tree-shaking is working, importing only a single export should result in a much smaller bundle than importing the entire package.

## Adding New Benchmarks

### Adding a Performance Benchmark

Edit `benchmarks/src/performance.ts`:

```typescript
async function myNewBenchmark(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []
  
  results.push(
    await benchmark('My Operation', async () => {
      // Your operation to benchmark
    })
  )
  
  return results
}

// Add to main() function:
const suites = [
  // ... existing suites
  { name: 'My New Suite', fn: myNewBenchmark },
]
```

### Updating Bundle Size Budgets

Edit `.size-limit.json` at the root:

```json
{
  "name": "My Package",
  "path": "packages/my-package/build/index.js",
  "limit": "50 KB"
}
```

### Adding Tree-shaking Tests

Edit `benchmarks/src/treeshake-check.ts`:

```typescript
const tests: TreeShakeTest[] = [
  // ... existing tests
  {
    name: 'MyExport only',
    import: "import { MyExport } from '@mfestack/core'",
    expectedMaxSize: 10000, // bytes
  },
]
```

## CI Integration

Benchmarks can be integrated into CI workflows:

```yaml
# .github/workflows/benchmark.yml
name: Benchmarks

on:
  pull_request:
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm build:all
      - run: pnpm benchmark:size
      - run: pnpm benchmark:treeshake
      # Performance benchmarks can be slower, run conditionally
      - run: pnpm benchmark:perf
        if: github.event_name == 'pull_request'
```

## Best Practices

1. **Baseline First**: Run benchmarks before making changes to establish baseline
2. **Multiple Runs**: Performance can vary, run benchmarks multiple times
3. **Update Budgets**: As the library grows, adjust size budgets realistically
4. **Monitor Trends**: Track benchmark results over time to catch regressions early
5. **Document Changes**: When updating budgets, document why in commit messages

## Troubleshooting

### "Build files not found"
Make sure to run `pnpm build:all` before running benchmarks.

### "Size limit exceeded"
1. Check if new features were added that legitimately increase size
2. Verify tree-shaking is working correctly
3. Consider code splitting or lazy loading
4. Update the budget if the increase is justified

### "Tree-shaking test failed"
1. Check if the export is actually used in the test
2. Verify package.json has `"sideEffects": false`
3. Check tsup/esbuild configuration for tree-shaking options

