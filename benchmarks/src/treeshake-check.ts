/**
 * Tree-shaking Verification
 * 
 * Verifies that unused exports are properly eliminated from the bundle.
 * This script creates minimal imports and checks bundle sizes.
 */

import { build } from 'esbuild'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '../..')

interface TreeShakeTest {
  name: string
  import: string
  expectedMaxSize: number // bytes
}

const tests: TreeShakeTest[] = [
  {
    name: 'QueryClient only',
    import: "import { QueryClient } from '@mfestack/core'",
    expectedMaxSize: 80000, // ~80KB - should be much smaller if tree-shaking works
  },
  {
    name: 'useQuery hook only',
    import: "import { useQuery } from '@mfestack/react'",
    expectedMaxSize: 15000, // ~15KB
  },
  {
    name: 'TaskScheduler only',
    import: "import { taskScheduler } from '@mfestack/core'",
    expectedMaxSize: 15000, // ~15KB
  },
  {
    name: 'EventBus only',
    import: "import { EventBus } from '@mfestack/core'",
    expectedMaxSize: 10000, // ~10KB
  },
]

async function buildTest(test: TreeShakeTest): Promise<{ size: number; path: string }> {
  const testFile = join(rootDir, 'benchmarks/temp-tree-shake-test.ts')
  const outputFile = join(rootDir, 'benchmarks/temp-tree-shake-output.js')

  try {
    // Create test file
    let usageCode = ''
    if (test.import.includes('QueryClient')) {
      usageCode = 'const test = new QueryClient()'
    } else if (test.import.includes('useQuery')) {
      usageCode = 'const test = useQuery'
    } else if (test.import.includes('taskScheduler')) {
      usageCode = 'const test = taskScheduler'
    } else if (test.import.includes('EventBus')) {
      usageCode = 'const test = new EventBus()'
    } else {
      // Generic fallback - extract export name
      const match = test.import.match(/\{\s*(\w+)/)
      if (match) {
        usageCode = `const test = ${match[1]}`
      }
    }

    writeFileSync(
      testFile,
      `${test.import}

// Ensure the import is actually used
${usageCode}

export { test }
`
    )

    await build({
      entryPoints: [testFile],
      bundle: true,
      format: 'esm',
      outfile: outputFile,
      external: ['react', 'react-dom'],
      treeShaking: true,
      minify: false,
      sourcemap: false,
      target: 'es2022',
      platform: 'browser',
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      tsconfig: join(rootDir, 'tsconfig.json'),
    })

    const size = readFileSync(outputFile).length

    return { size, path: outputFile }
  } finally {
    // Cleanup
    if (existsSync(testFile)) unlinkSync(testFile)
  }
}

async function main() {
  console.log('🌳 Tree-shaking Verification\n')
  console.log('='.repeat(60))
  console.log()

  let allPassed = true

  for (const test of tests) {
    console.log(`Testing: ${test.name}`)
    console.log(`Import: ${test.import}`)

    try {
      const { size, path } = await buildTest(test)
      const sizeKB = (size / 1024).toFixed(2)
      const expectedKB = (test.expectedMaxSize / 1024).toFixed(2)
      const passed = size <= test.expectedMaxSize

      console.log(`  Size: ${sizeKB} KB (max: ${expectedKB} KB)`)

      if (passed) {
        console.log(`  ✅ PASSED\n`)
      } else {
        console.log(`  ❌ FAILED (${sizeKB} KB > ${expectedKB} KB)\n`)
        allPassed = false
      }

      // Cleanup output file
      if (existsSync(path)) unlinkSync(path)
    } catch (error) {
      console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}\n`)
      allPassed = false
    }
  }

  console.log('='.repeat(60))

  if (allPassed) {
    console.log('✅ All tree-shaking tests passed!\n')
    process.exit(0)
  } else {
    console.log('❌ Some tree-shaking tests failed\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Tree-shake check failed:', error)
  process.exit(1)
})

