import fs from 'fs/promises'
import path from 'path'

interface ClaudeSetupOptions {
  projectRoot: string
  projectName: string
  logger?: (message: string) => void
}

export async function setupClaude({ projectRoot, projectName, logger }: ClaudeSetupOptions) {
  const log = logger || console.log
  log('📝 Setting up Claude.md configuration...')

  const claudeMdContent = `# Claude Project Configuration

## Project Overview

This is a ${projectName} - a Next.js 15+ application with TypeScript, using Payload CMS v3 as the backend, Better Auth for authentication, Stripe for payments, and a structured architecture following Domain-Driven Design principles.

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

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── (frontend)/        # Public-facing app
│   │   ├── (app)/        # Web app pages
│   │   │   ├── (authenticated)/  # Pages requiring auth
│   │   │   └── (public)/         # Public app pages
│   │   ├── (auth)/       # Auth pages
│   │   ├── (website)/    # Marketing pages
│   │   └── api/          # API routes
│   └── (payload)/         # Payload admin
├── blocks/                # Payload blocks
├── collections/           # Payload collections
├── components/            # React components
│   ├── atoms/            # Basic UI components
│   └── molecules/        # Composite components
├── emails/               # Email templates
├── hooks/                # React hooks
├── jobs/                 # Background jobs
├── lib/                  # Core libraries
│   ├── auth/            # Auth utilities
│   ├── data/            # Data access layer
│   │   ├── payload/     # Payload operations
│   │   └── stripe/      # Stripe operations
│   ├── types/           # Payload-generated types
│   └── utils/           # Utility functions
├── migrations/           # Database migrations
├── plugins/              # Payload plugins
├── scripts/              # Utility scripts
├── types/                # Custom TypeScript types (non-Payload)
└── utils/                # Additional utility functions
\`\`\`

## Branch Strategy

Projects always maintain these core branches:
- **main**: Production environment
- **staging**: Staging environment
- **dev**: Common development environment
- **feature/***: Feature branches (created from dev)

Workflow: \`dev\` → \`feature/*\` → PR to \`dev\` → \`staging\` → \`main\`

## Critical Coding Conventions

### 1. Data Fetching Rules

**NEVER use these patterns:**
- ❌ \`fetch()\` directly in components
- ❌ \`useEffect()\` for data fetching
- ❌ Direct Payload/Stripe SDK calls in components
- ❌ Inline async operations in components

**ALWAYS use:**
- ✅ Server Actions for all server-side operations
- ✅ TanStack Query hooks (\`useQuery\`, \`useMutation\`)
- ✅ Centralized data access via \`payloadHook\` and \`stripeHook\`

**Exception for Third-Party APIs:**
When fetching from external APIs (not Payload/Stripe):
\`\`\`typescript
// Client-side: Use TanStack Query with manual key management
const { data, isLoading } = useQuery({
  queryKey: ['external-api', 'resource', params],
  queryFn: () => fetchFromExternalAPI(params),
  staleTime: 5 * 60 * 1000,
})

// Server-side: Create server action
'use server'
export async function fetchExternalDataAction(params) {
  logger.info('Fetching external data', { params })
  try {
    const data = await externalAPI.fetch(params)
    return { success: true, data }
  } catch (error) {
    logger.error('External API error', { error, params })
    return { success: false, error: error.message }
  }
}
\`\`\`

### 2. Component Architecture by Location

**Website Components** (\`(website)\` folder):
- ✅ ALWAYS Server Components by default
- ✅ Optimized for SEO and initial load speed
- ✅ Client Components only for interactivity
- ✅ Aggressive caching strategies

**Web App Components** (\`(app)\` folder):
- ✅ Client Components are preferred for simplicity
- ✅ Rich interactivity and real-time updates
- ✅ Complex state management
- ✅ Focus on UX over SEO

\`\`\`typescript
// Website component - Server by default
// src/components/molecules/website-sections/HeroSection/index.tsx
export default function HeroSection({ data }: Props) {
  return <section>...</section>
}

// Web app component - Client by default
// src/components/molecules/dashboard/DataTable/index.tsx
'use client'
export default function DataTable({ data }: Props) {
  const [state, setState] = useState()
  return <div>...</div>
}
\`\`\`

### 3. Authentication Pattern

Layouts handle auth redirection via useEffect:

\`\`\`typescript
// (authenticated)/layout.tsx
'use client'
export default function AuthenticatedLayout({ children }) {
  const { data: session, isLoading } = authClient.useSession()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/sign-in')
    }
  }, [session, isLoading])

  if (isLoading) return <LoadingSpinner />
  if (!session) return null

  return <>{children}</>
}

// (public)/layout.tsx - No auth required
export default function PublicLayout({ children }) {
  return <>{children}</>
}
\`\`\`

### 4. Type Safety Requirements

**Payload-Generated Types:**
\`\`\`typescript
// From lib/types/payload-types.ts (auto-generated)
import type { User, Post } from '@/lib/types/payload-types'
\`\`\`

**Custom Types (non-Payload):**
\`\`\`typescript
// From types/ folder for custom business logic types
// types/analytics.types.ts
export interface AnalyticsEvent {
  name: string
  properties: Record<string, unknown>
}

// types/external-api.types.ts
export interface ThirdPartyResponse {
  data: unknown
  meta: ApiMetadata
}
\`\`\`

- **NEVER** use \`any\` type
- **ALWAYS** define types for external APIs in \`types/\` folder
- **ALWAYS** use Payload-generated types when available

### 5. Logging Conventions

Every server action and API route MUST implement structured logging:

\`\`\`typescript
import { logger } from '@/lib/logger'

// Server Action Template
'use server'
export async function actionName(params: Params): Promise<Result> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  logger.info('Action started', {
    action: 'actionName',
    requestId,
    params: sanitizeParams(params), // Remove sensitive data
  })

  try {
    const result = await performOperation(params)

    logger.info('Action completed', {
      action: 'actionName',
      requestId,
      duration: Date.now() - startTime,
      success: true,
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error('Action failed', {
      action: 'actionName',
      requestId,
      duration: Date.now() - startTime,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
      },
    })

    return {
      success: false,
      error: 'Operation failed', // Generic message for client
      code: error.code,
    }
  }
}

// Log Levels:
// logger.debug() - Detailed debugging information
// logger.info()  - General informational messages
// logger.warn()  - Warning messages
// logger.error() - Error messages
// logger.fatal() - Critical errors requiring immediate attention
\`\`\`

### 6. Component State Management

Every component with async operations MUST handle all states:

\`\`\`typescript
'use client'
export function DataComponent() {
  const { data, isLoading, error } = useQuery(...)

  // Loading state
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load data. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No data found"
        description="Get started by creating your first item"
        action={<Button>Create Item</Button>}
      />
    )
  }

  // Success state
  return <DataDisplay data={data} />
}
\`\`\`

### 7. Query Key Conventions

**Standardized Interfaces (Automatic):**
When using \`payloadHook\` or \`stripeHook\`, query keys are managed automatically:
\`\`\`typescript
// Query keys are handled internally
const { data } = payloadHook.find({ collection: 'users' })
\`\`\`

**Custom Queries (Manual):**
Follow this pattern for custom/third-party queries:
\`\`\`typescript
// Pattern: [domain, resource, operation, ...params]
['github', 'repos', 'list', { org: 'acme' }]
['analytics', 'events', 'aggregate', { range: '7d' }]
['weather', 'forecast', { city: 'Paris' }]

// Implementation
const { data } = useQuery({
  queryKey: ['weather', 'forecast', { city }],
  queryFn: () => weatherAPI.getForecast(city),
})
\`\`\`

### 8. Security & Access Control

**Payload RBAC (Role-Based Access Control):**
Always use Payload's built-in access control for API security:

\`\`\`typescript
// Collection access control
export const PostsCollection: CollectionConfig = {
  slug: 'posts',
  access: {
    read: ({ req: { user } }) => {
      // Public read
      return true
    },
    create: ({ req: { user } }) => {
      // Only authenticated users
      return Boolean(user)
    },
    update: ({ req: { user }, id }) => {
      // Only owner or admin
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        author: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Only admins
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      access: {
        read: true,
        update: ({ req: { user }, data }) => {
          // Field-level access control
          return user?.role === 'editor' || user?.id === data?.author
        },
      },
    },
  ],
}
\`\`\`

### 9. File Naming Conventions

- **Components**: PascalCase (\`UserProfile.tsx\`)
- **Hooks**: camelCase with \`use\` prefix (\`useUserData.ts\`)
- **Server Actions**: camelCase with \`Action\` suffix (\`getUserAction.ts\`)
- **Types**: PascalCase with context (\`UserProfile.types.ts\`)
- **Utils**: camelCase (\`formatDate.ts\`)
- **Custom Types**: Located in \`/types/\` folder, not \`/lib/types/\`

## Development Workflow

1. **Create feature branch from \`dev\`** (not main)
   \`\`\`bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-feature
   \`\`\`

2. **Build UI with mock data first**
   - Design component structure
   - Implement with static/mock data
   - Ensure responsive design
   - Add loading/error/empty states

3. **Wire up backend** (if needed)
   - Use standardized operations when possible (\`payloadHook\`, \`stripeHook\`)
   - Create custom server actions only when necessary
   - Implement proper logging and error handling

4. **Write tests**
   - Unit tests for utilities
   - Integration tests for server actions
   - E2E tests for critical flows

5. **Submit PR to \`dev\`**
   - Clear description
   - Screenshots for UI changes
   - Test results
   - Breaking changes noted

## Error Handling Standards

### Server Actions
\`\`\`typescript
'use server'
export async function serverAction(input: Input): Promise<ActionResult> {
  try {
    // Validate input
    const validated = schema.parse(input)

    // Perform operation
    const result = await operation(validated)

    // Return typed success
    return { success: true, data: result }
  } catch (error) {
    // Log full error server-side
    logger.error('Action failed', { error, input })

    // Return safe error to client
    if (error instanceof ValidationError) {
      return { success: false, error: 'Invalid input', code: 'VALIDATION_ERROR' }
    }

    return { success: false, error: 'Operation failed', code: 'INTERNAL_ERROR' }
  }
}
\`\`\`

### Client Components
\`\`\`typescript
function handleError(error: unknown) {
  if (error instanceof AppError) {
    toast.error(error.message)
  } else {
    toast.error('Something went wrong. Please try again.')
    console.error('Unexpected error:', error)
  }
}
\`\`\`

## Performance Guidelines

### Website (Marketing)
1. **Server Components by default** - Minimize client JS
2. **Static generation** where possible
3. **Image optimization** with Next.js Image
4. **Font optimization** with next/font
5. **Minimize Time to First Byte (TTFB)**

### Web App
1. **Client Components for interactivity** - Simplify state management
2. **Proper caching** with TanStack Query
3. **Code splitting** with dynamic imports
4. **Optimistic updates** for better UX
5. **Virtual scrolling** for large lists

## Testing Strategy

1. **Unit tests** for utilities and helpers
2. **Integration tests** for server actions
3. **E2E tests** for critical user flows (auth, checkout, core features)
4. **Type checking** in CI/CD pipeline
5. **Accessibility testing** with automated tools

## Available MCP Servers

When configured, the following MCP servers provide enhanced capabilities:
- **Figma**: Design system integration
- **Playwright**: Browser automation and testing
- **Stripe**: Payment operations
- **Notion**: Documentation and planning
- **Vercel**: Deployment management
- **Shadcn**: UI component library

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

### Agent Communication
- Structured task delegation protocol
- Context preservation across interactions
- Comprehensive specifications and implementation guides
- Quality validation and review processes

## Important Notes

1. **Never commit sensitive data** - Always use environment variables
2. **Follow the branch strategy** - Create features from \`dev\`, not \`main\`
3. **Use the agent system** - Leverage specialized agents for complex tasks
4. **Maintain code quality** - All code must pass review standards
5. **Document decisions** - Update this file when architecture changes

## Commands

Available npm scripts:
\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run test suite
npm run test:e2e     # Run E2E tests
\`\`\`

---

This configuration enables Claude Code to work optimally with your project structure, conventions, and multi-agent architecture.`

  await fs.writeFile(path.join(projectRoot, 'CLAUDE.md'), claudeMdContent)
  log('✅ Created CLAUDE.md configuration file')
  log('📋 Configured project structure, conventions, and agent system')
  log('🎯 Ready for optimal Claude Code integration')
}