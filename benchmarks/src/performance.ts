/**
 * Performance Benchmarks for MFestack Query
 * 
 * Measures:
 * - Query creation and cache operations
 * - BatchManager throughput
 * - TaskScheduler overhead
 * - Select memoization performance
 * - Structural sharing benefits
 */

import { QueryClient, createQueryClient } from '@mfestack/core'
import { mockFetch, waitFor } from '@mfestack/test-utils'

interface BenchmarkResult {
  name: string
  opsPerSecond: number
  avgTime: number
  minTime: number
  maxTime: number
  samples: number[]
}

interface BenchmarkSuite {
  name: string
  results: BenchmarkResult[]
}

const WARMUP_ITERATIONS = 10
const BENCHMARK_ITERATIONS = 100
const TARGET_DURATION_MS = 1000 // Run for ~1 second per benchmark

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function calculateStats(samples: number[]): Omit<BenchmarkResult, 'name' | 'samples'> {
  const sum = samples.reduce((a, b) => a + b, 0)
  const avg = sum / samples.length
  const min = Math.min(...samples)
  const max = Math.max(...samples)
  const opsPerSecond = (1000 / avg) * samples.length

  return {
    opsPerSecond,
    avgTime: avg,
    minTime: min,
    maxTime: max,
  }
}

async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations: number = BENCHMARK_ITERATIONS
): Promise<BenchmarkResult> {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await fn()
  }

  const samples: number[] = []
  const startTime = performance.now()

  while (samples.length < iterations || performance.now() - startTime < TARGET_DURATION_MS) {
    const iterStart = performance.now()
    await fn()
    const iterEnd = performance.now()
    samples.push(iterEnd - iterStart)
  }

  const stats = calculateStats(samples)

  return {
    name,
    ...stats,
    samples,
  }
}

async function runBenchmarkSuite(suite: () => Promise<BenchmarkResult[]>): Promise<void> {
  console.log(`\n🧪 Running benchmark suite...\n`)
  const results = await suite()

  console.log('Results:\n')
  console.log('┌─────────────────────────────────────┬──────────────────┬──────────────┬───────────┬───────────┐')
  console.log('│ Benchmark                          │ Ops/sec          │ Avg Time     │ Min       │ Max       │')
  console.log('├─────────────────────────────────────┼──────────────────┼──────────────┼───────────┼───────────┤')

  for (const result of results) {
    const name = result.name.padEnd(35)
    const ops = formatNumber(result.opsPerSecond).padStart(16)
    const avg = formatTime(result.avgTime).padStart(12)
    const min = formatTime(result.minTime).padStart(9)
    const max = formatTime(result.maxTime).padStart(9)

    console.log(`│ ${name} │ ${ops} │ ${avg} │ ${min} │ ${max} │`)
  }

  console.log('└─────────────────────────────────────┴──────────────────┴──────────────┴───────────┴───────────┘\n')
}

async function queryCreationBenchmarks(): Promise<BenchmarkResult[]> {
  const client = createQueryClient()
  const results: BenchmarkResult[] = []

  results.push(
    await benchmark('QueryClient.createQuery', async () => {
      client.createQuery({
        queryKey: ['test', Math.random()],
        queryFn: async () => ({ data: 'test' }),
      })
    })
  )

  results.push(
    await benchmark('QueryCache.get', async () => {
      const queryKey = ['test', 'cache']
      client.createQuery({
        queryKey,
        queryFn: async () => ({ data: 'test' }),
      })
      client.getQueryCache().get(queryKey)
    })
  )

  results.push(
    await benchmark('QueryCache.set', async () => {
      client.getQueryCache().set(
        ['test', Math.random()],
        {
          queryFn: async () => ({ data: 'test' }),
        },
        {}
      )
    })
  )

  results.push(
    await benchmark('QueryCache.remove', async () => {
      const queryKey = ['test', Math.random()]
      client.createQuery({
        queryKey,
        queryFn: async () => ({ data: 'test' }),
      })
      client.getQueryCache().remove(queryKey)
    })
  )

  return results
}

async function batchManagerBenchmarks(): Promise<BenchmarkResult[]> {
  // Note: BatchManager is not directly exported, we test batchManager instance
  // For benchmarking, we'll test via QueryClient which uses BatchManager internally
  const client = createQueryClient()
  const results: BenchmarkResult[] = []

  results.push(
    await benchmark('QueryClient notifications (100 queries)', async () => {
      for (let i = 0; i < 100; i++) {
        client.createQuery({
          queryKey: ['batch', i],
          queryFn: async () => ({ data: i }),
        })
      }
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  )

  results.push(
    await benchmark('QueryCache batch operations (100 ops)', async () => {
      const cache = client.getQueryCache()
      for (let i = 0; i < 100; i++) {
        cache.set(['batch', i], { queryFn: async () => ({ data: i }) }, {})
      }
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  )

  return results
}

async function schedulerBenchmarks(): Promise<BenchmarkResult[]> {
  const coreModule = await import('@mfestack/core')
  const taskScheduler = (coreModule as any).taskScheduler
  if (!taskScheduler) {
    throw new Error('taskScheduler not found in @mfestack/core')
  }
  const results: BenchmarkResult[] = []

  results.push(
    await benchmark('TaskScheduler.schedule (single task)', async () => {
      const controller = new AbortController()
      taskScheduler.schedule(
        () => {},
        {
          delay: 0,
          priority: 'normal',
          signal: controller.signal,
        }
      )
      await new Promise((resolve) => setTimeout(resolve, 1))
      controller.abort()
    })
  )

  results.push(
    await benchmark('TaskScheduler.schedule (100 tasks)', async () => {
      const controllers: AbortController[] = []
      for (let i = 0; i < 100; i++) {
        const controller = new AbortController()
        controllers.push(controller)
        taskScheduler.schedule(
          () => {},
          {
            delay: 0,
            priority: 'normal',
            signal: controller.signal,
          }
        )
      }
      await new Promise((resolve) => setTimeout(resolve, 10))
      controllers.forEach((c) => c.abort())
    })
  )

  results.push(
    await benchmark('TaskScheduler.scheduleRepeat (interval)', async () => {
      const controller = new AbortController()
      taskScheduler.scheduleRepeat(
        () => {},
        {
          interval: 10,
          priority: 'low',
          signal: controller.signal,
        }
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      controller.abort()
    })
  )

  return results
}

async function structuralSharingBenchmarks(): Promise<BenchmarkResult[]> {
  const coreModule = await import('@mfestack/core')
  const replaceEqualDeep = (coreModule as any).replaceEqualDeep
  if (!replaceEqualDeep) {
    throw new Error('replaceEqualDeep not found in @mfestack/core')
  }
  const results: BenchmarkResult[] = []

  const smallObj = { a: 1, b: 2, c: { d: 3 } }
  const largeObj = {
    a: Array.from({ length: 1000 }, (_, i) => i),
    b: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
    c: { nested: Array.from({ length: 100 }, (_, i) => ({ key: i })) },
  }

  results.push(
    await benchmark('replaceEqualDeep (small, equal)', async () => {
      replaceEqualDeep(smallObj, { ...smallObj })
    })
  )

  results.push(
    await benchmark('replaceEqualDeep (small, different)', async () => {
      replaceEqualDeep(smallObj, { a: 1, b: 2, c: { d: 4 } })
    })
  )

  results.push(
    await benchmark('replaceEqualDeep (large, equal)', async () => {
      replaceEqualDeep(largeObj, JSON.parse(JSON.stringify(largeObj)))
    })
  )

  results.push(
    await benchmark('replaceEqualDeep (large, different)', async () => {
      replaceEqualDeep(largeObj, { ...largeObj, a: [999] })
    })
  )

  return results
}

async function queryObserverBenchmarks(): Promise<BenchmarkResult[]> {
  const client = createQueryClient()
  mockFetch(() => Promise.resolve({ data: { value: 42 } }))

  const results: BenchmarkResult[] = []

  results.push(
    await benchmark('QueryObserver.createQuery (with fetch)', async () => {
      await client.fetchQuery({
        queryKey: ['bench', Math.random()],
        queryFn: async () => {
          const res = await fetch('http://localhost/test')
          return res.json()
        },
      })
    })
  )

  results.push(
    await benchmark('QueryObserver.select (memoized)', async () => {
      const queryKey = ['select-test']
      await client.fetchQuery({
        queryKey,
        queryFn: async () => ({ a: 1, b: 2, c: { d: 3 } }),
      })

      for (let i = 0; i < 10; i++) {
        client.getQueryCache().get(queryKey)?.subscribe((query) => {
          const selected = query.state.data
          return selected
        })
      }
    })
  )

  return results
}

async function main() {
  console.log('🚀 MFestack Query Performance Benchmarks\n')
  console.log('=' .repeat(60))

  const suites: Array<{ name: string; fn: () => Promise<BenchmarkResult[]> }> = [
    { name: 'Query Creation & Cache Operations', fn: queryCreationBenchmarks },
    { name: 'BatchManager Performance', fn: batchManagerBenchmarks },
    { name: 'TaskScheduler Performance', fn: schedulerBenchmarks },
    { name: 'Structural Sharing (replaceEqualDeep)', fn: structuralSharingBenchmarks },
    { name: 'QueryObserver & Select Memoization', fn: queryObserverBenchmarks },
  ]

  for (const suite of suites) {
    console.log(`\n📊 ${suite.name}`)
    console.log('─'.repeat(60))
    await runBenchmarkSuite(suite.fn)
  }

  console.log('✅ Benchmark suite complete!\n')
}

main().catch((error) => {
  console.error('❌ Benchmark failed:', error)
  process.exit(1)
})

