import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

interface MCPSetupOptions {
  projectRoot: string
  logger?: (message: string) => void
}

export async function setupMCP({ projectRoot, logger }: MCPSetupOptions) {
  const log = logger || console.log

  log('🚀 Setting up MCP servers...')

  const mcpConfig = {
    mcpServers: {
      figma: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-figma'],
        env: {
          FIGMA_PERSONAL_ACCESS_TOKEN: '${FIGMA_PERSONAL_ACCESS_TOKEN}',
        },
      },
      playwright: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-playwright'],
        env: {
          PLAYWRIGHT_BROWSER: 'chromium',
        },
      },
      stripe: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-stripe'],
        env: {
          STRIPE_API_KEY: '${STRIPE_SECRET_KEY}',
        },
      },
      notion: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-notion'],
        env: {
          NOTION_API_KEY: '${NOTION_API_TOKEN}',
        },
      },
      vercel: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-vercel'],
        env: {
          VERCEL_ACCESS_TOKEN: '${VERCEL_TOKEN}',
          VERCEL_TEAM_ID: '${VERCEL_TEAM_ID}',
        },
      },
      shadcn: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-shadcn'],
      },
    },
  }

  // Detect environment and write to appropriate location
  const platform = os.platform()
  const homeDir = os.homedir()

  const configPaths = [
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

  for (const configPath of configPaths) {
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true })

      // Check if file exists and merge configs
      let existingConfig = {}
      try {
        const existing = await fs.readFile(configPath, 'utf-8')
        existingConfig = JSON.parse(existing)
      } catch {
        // File doesn't exist, that's okay
      }

      const mergedConfig = {
        ...existingConfig,
        ...mcpConfig,
      }

      await fs.writeFile(
        configPath,
        JSON.stringify(mergedConfig, null, 2)
      )
      log(`✅ Configured MCP for: ${configPath}`)
    } catch (error) {
      log(`⚠️  Could not configure: ${configPath}`)
    }
  }

  // Install Playwright browsers
  log('📦 Installing Playwright browsers...')
  try {
    execSync('npx playwright install chromium', { stdio: 'inherit' })
  } catch {
    log('⚠️  Playwright browser installation failed')
  }

  // Create .env.mcp.example
  const envExample = `# MCP Server Environment Variables
# Copy this to .env.local and fill in your values

# Figma
FIGMA_PERSONAL_ACCESS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Notion
NOTION_API_TOKEN=

# Vercel
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Set these as system environment variables for MCP servers to work
# On Windows: Use System Properties → Environment Variables
# On macOS/Linux: Add to ~/.bashrc or ~/.zshrc
`

  await fs.writeFile(path.join(projectRoot, '.env.mcp.example'), envExample)

  log('\n✅ MCP setup complete!')
  log('\n📝 Next steps:')
  log('1. Copy .env.mcp.example to .env.local')
  log('2. Fill in your API keys and tokens')
  log('3. Set system environment variables (see .env.mcp.example)')
  log('4. Restart Claude Desktop/Cursor to load MCP servers')
}