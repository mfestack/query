/**
 * Main benchmark runner
 * Orchestrates all benchmark suites
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '../..')

async function runCommand(command: string, description: string): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 ${description}`)
  console.log('='.repeat(60))

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: rootDir,
      encoding: 'utf-8',
    })

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    return true
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`)
    if (error.stdout) console.error(error.stdout)
    if (error.stderr) console.error(error.stderr)
    return false
  }
}

async function checkBuilds(): Promise<boolean> {
  const requiredBuilds = [
    'packages/core/build/index.js',
    'packages/react/build/index.js',
  ]

  const missing = requiredBuilds.filter((path) => !existsSync(join(rootDir, path)))

  if (missing.length > 0) {
    console.error('❌ Missing builds. Please run `pnpm build` first.')
    console.error('Missing:', missing.join(', '))
    return false
  }

  return true
}

async function main() {
  console.log('🚀 MFestack Query Benchmark Suite')
  console.log('='.repeat(60))

  // Check if builds exist
  if (!(await checkBuilds())) {
    process.exit(1)
  }

  const benchmarks = [
    {
      command: 'pnpm --filter @mfestack/benchmarks benchmark:size',
      description: 'Bundle Size Benchmarks (size-limit)',
    },
    {
      command: 'pnpm --filter @mfestack/benchmarks benchmark:treeshake',
      description: 'Tree-shaking Verification',
    },
    {
      command: 'pnpm --filter @mfestack/benchmarks benchmark:perf',
      description: 'Performance Benchmarks',
    },
  ]

  let allPassed = true

  for (const bench of benchmarks) {
    const passed = await runCommand(bench.command, bench.description)
    if (!passed) {
      allPassed = false
      // Continue with other benchmarks even if one fails
    }
  }

  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ All benchmarks completed successfully!\n')
    process.exit(0)
  } else {
    console.log('⚠️  Some benchmarks had errors (see above)\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Benchmark runner failed:', error)
  process.exit(1)
})

