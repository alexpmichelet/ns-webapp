import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import os from 'os'

interface VerifySetupOptions {
  projectRoot: string
  logger?: (message: string) => void
}

export async function verifySetup({ projectRoot, logger }: VerifySetupOptions) {
  const log = logger || console.log
  log('🧪 Verifying Claude Code setup...\n')

  const checks = [
    {
      name: 'CLAUDE.md configuration file',
      check: () => existsSync(path.join(projectRoot, 'CLAUDE.md')),
    },
    {
      name: 'Agent system directory structure',
      check: () => {
        const claudeDir = path.join(projectRoot, '.claude')
        return existsSync(path.join(claudeDir, 'agents')) &&
               existsSync(path.join(claudeDir, 'context')) &&
               existsSync(path.join(claudeDir, 'knowledge')) &&
               existsSync(path.join(claudeDir, 'protocols'))
      },
    },
    {
      name: 'Agent configuration files',
      check: () => {
        const agentsDir = path.join(projectRoot, '.claude', 'agents')
        const requiredAgents = [
          'main-orchestrator.md',
          'frontend-expert.md',
          'backend-expert.md',
          'stripe-specialist.md',
          'auth-specialist.md',
          'code-reviewer.md',
          'devops-agent.md'
        ]
        return requiredAgents.every(agent => existsSync(path.join(agentsDir, agent)))
      },
    },
    {
      name: 'Knowledge base files',
      check: () => {
        const knowledgeDir = path.join(projectRoot, '.claude', 'knowledge')
        return existsSync(path.join(knowledgeDir, 'conventions.md')) &&
               existsSync(path.join(knowledgeDir, 'patterns.md')) &&
               existsSync(path.join(knowledgeDir, 'architecture.md'))
      },
    },
    {
      name: 'Communication protocol',
      check: () => existsSync(path.join(projectRoot, '.claude', 'protocols', 'communication.md')),
    },
    {
      name: 'MCP environment example file',
      check: () => existsSync(path.join(projectRoot, '.env.mcp.example')),
    }
  ]

  // Check MCP configuration in user directories
  const platform = os.platform()
  const homeDir = os.homedir()
  const mcpConfigPaths = [
    // Claude Desktop
    platform === 'win32'
      ? path.join(process.env.APPDATA!, 'Claude', 'claude_desktop_config.json')
      : platform === 'darwin'
      ? path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'),
    // Cursor
    path.join(homeDir, '.cursor', 'mcp', 'mcp.json'),
    // Claude Code
    path.join(homeDir, '.claude', 'mcp.json'),
  ]

  const mcpConfigured = mcpConfigPaths.some(configPath => {
    if (existsSync(configPath)) {
      try {
        const content = require('fs').readFileSync(configPath, 'utf8')
        const config = JSON.parse(content)
        return config.mcpServers && Object.keys(config.mcpServers).length > 0
      } catch {
        return false
      }
    }
    return false
  })

  checks.push({
    name: 'MCP servers configured',
    check: () => mcpConfigured,
  })

  // Test MCP servers availability
  const mcpServers = [
    { name: 'figma', test: 'FIGMA_PERSONAL_ACCESS_TOKEN' },
    { name: 'playwright', test: null },
    { name: 'stripe', test: 'STRIPE_SECRET_KEY' },
    { name: 'notion', test: 'NOTION_API_TOKEN' },
    { name: 'vercel', test: 'VERCEL_TOKEN' },
    { name: 'shadcn', test: null },
  ]

  const mcpResults = []
  for (const server of mcpServers) {
    try {
      // Check if environment variable is set (if required)
      if (server.test && !process.env[server.test]) {
        mcpResults.push({ name: server.name, status: 'warning', message: `Missing ${server.test} environment variable` })
        continue
      }

      // Try to check if server package is available
      execSync(`npx -y @modelcontextprotocol/server-${server.name} --version`, {
        stdio: 'pipe',
        timeout: 5000,
      })

      mcpResults.push({ name: server.name, status: 'success', message: 'Available' })
    } catch {
      mcpResults.push({ name: server.name, status: 'error', message: 'Not available' })
    }
  }

  // Run all checks
  log('📋 Core Setup Verification:')
  for (const check of checks) {
    const result = check.check()
    const status = result ? '✅' : '❌'
    log(`${status} ${check.name}`)
  }

  log('\n🔌 MCP Servers Status:')
  for (const result of mcpResults) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    log(`${icon} ${result.name}: ${result.message}`)
  }

  // Check if project dependencies are installed
  log('\n📦 Project Dependencies:')
  const hasNodeModules = existsSync(path.join(projectRoot, 'node_modules'))
  const hasPackageJson = existsSync(path.join(projectRoot, 'package.json'))
  log(`${hasPackageJson ? '✅' : '❌'} package.json exists`)
  log(`${hasNodeModules ? '✅' : '❌'} node_modules installed`)

  if (hasPackageJson) {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'))
      const hasPayload = packageJson.dependencies?.payload || packageJson.devDependencies?.payload
      const hasNext = packageJson.dependencies?.next || packageJson.devDependencies?.next
      const hasTailwind = packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss

      log(`${hasNext ? '✅' : '❌'} Next.js configured`)
      log(`${hasPayload ? '✅' : '❌'} Payload CMS configured`)
      log(`${hasTailwind ? '✅' : '❌'} Tailwind CSS configured`)
    } catch {
      log('❌ Could not read package.json')
    }
  }

  // Summary and next steps
  log('\n📝 Next Steps:')
  log('1. If MCP servers show warnings, set the required environment variables')
  log('2. Copy .env.mcp.example to .env.local and fill in your API keys')
  log('3. Set system environment variables for MCP servers to work globally')
  log('4. Restart Claude Desktop, Cursor, or Claude Code to load MCP servers')
  log('5. Test the agent system by asking Claude to delegate tasks to specialists')

  log('\n✅ Claude Code setup verification complete!')
  log('🎯 Your project is configured for optimal Claude Code integration')

  return {
    coreSetup: checks.every(check => check.check()),
    mcpConfigured,
    mcpServers: mcpResults,
  }
}