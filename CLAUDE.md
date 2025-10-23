# Claude Project Configuration

## Project Overview

This is ns-webapp - a Next.js 15+ application with TypeScript, using Payload CMS v3 as the backend, Better Auth for authentication, Stripe for payments, and a structured architecture following Domain-Driven Design principles.

## Core Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **CMS**: Payload CMS v3 with PostgreSQL
- **Authentication**: Better Auth (via payload-auth plugin)
- **Payments**: Stripe
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Fetching**: TanStack Query + Server Actions
- **Email**: React Email + Resend
- **Database**: PostgreSQL (via Supabase)

## Multi-Agent Architecture

This project uses a sophisticated multi-agent system for development workflow:

### Main Orchestrator Agent
- Coordinates all development tasks
- Delegates to specialized sub-agents
- Implements recommendations from experts

### Specialized Agents
- **Frontend Expert**: UI/UX, React, Next.js implementations
- **Backend Expert**: Payload CMS, database, server actions
- **Stripe Specialist**: Payment flows, subscriptions, billing
- **Auth Specialist**: Authentication, authorization, security
- **Code Reviewer**: Quality, security, testing standards
- **DevOps Agent**: Deployment, CI/CD, infrastructure

## Available MCP Servers

When configured, the following MCP servers provide enhanced capabilities:
- **Figma**: Design system integration
- **Playwright**: Browser automation and testing
- **Stripe**: Payment operations
- **Notion**: Documentation and planning
- **Vercel**: Deployment management
- **Shadcn**: UI component library

## Commands

Available npm scripts:
```bash
npm run claude:setup    # Complete Claude Code setup
npm run claude:mcp      # Setup MCP servers only
npm run claude:agents   # Setup agents only
npm run claude:verify   # Verify setup
```

---

This configuration enables Claude Code to work optimally with your project structure, conventions, and multi-agent architecture.