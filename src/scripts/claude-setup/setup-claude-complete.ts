import fs from 'fs/promises'
import path from 'path'
import { setupMCP } from './setup-mcp'
import { bootstrapAgents } from './bootstrap-agents'
import { setupClaude } from './setup-claude'
import { verifySetup } from './verify-setup'

interface CompleteClaudeSetupOptions {
  projectRoot: string
  projectName: string
  logger?: (message: string) => void
  skipVerify?: boolean
}

export async function setupClaudeComplete({
  projectRoot,
  projectName,
  logger,
  skipVerify = false
}: CompleteClaudeSetupOptions) {
  const log = logger || console.log

  log('🚀 Starting complete Claude Code setup...')

  try {
    // Step 1: Setup MCP servers
    log('\n📡 Step 1: Setting up MCP servers...')
    await setupMCP({ projectRoot, logger })

    // Step 2: Bootstrap agent architecture
    log('\n🤖 Step 2: Bootstrapping agent system...')
    await bootstrapAgents({ projectRoot, projectName, logger })

    // Step 3: Create CLAUDE.md configuration
    log('\n📝 Step 3: Creating Claude configuration...')
    await setupClaude({ projectRoot, projectName, logger })

    // Step 4: Verify setup (optional)
    if (!skipVerify) {
      log('\n🧪 Step 4: Verifying setup...')
      const verification = await verifySetup({ projectRoot, logger })

      if (verification.coreSetup) {
        log('\n🎉 Complete Claude Code setup successful!')
      } else {
        log('\n⚠️  Setup completed with some issues. Check the verification results above.')
      }
    } else {
      log('\n🎉 Complete Claude Code setup successful!')
    }

    // Final instructions
    log('\n📋 What was configured:')
    log('• MCP servers for all environments (Claude Desktop, Cursor, Claude Code)')
    log('• Multi-agent architecture with 6 specialized agents')
    log('• Complete project knowledge base and conventions')
    log('• CLAUDE.md configuration file with all project details')
    log('• Communication protocols for agent coordination')

    log('\n🎯 To get started:')
    log('1. Restart Claude Desktop, Cursor, or Claude Code')
    log('2. Fill in API keys in .env.mcp.example and copy to .env.local')
    log('3. Set system environment variables for MCP servers')
    log('4. Start using the multi-agent system by asking Claude to delegate tasks')

    return { success: true }
  } catch (error) {
    log('\n❌ Claude Code setup failed:')
    log(error instanceof Error ? error.message : String(error))
    return { success: false, error }
  }
}