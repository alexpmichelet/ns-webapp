# Time & Materials Project Management System - Documentation

Welcome to the comprehensive documentation for the Time & Materials workflow management application.

---

## 📚 Documentation Structure

### Core Documentation

1. **[Project Architecture](./PROJECT_ARCHITECTURE.md)**
   - Technology stack overview
   - System architecture diagrams
   - Directory structure
   - Component organization
   - Data layer architecture
   - Security considerations
   - Performance optimization strategies

2. **[Implementation Plan](./IMPLEMENTATION_PLAN.md)**
   - Phase-by-phase development guide (12 phases)
   - Task breakdowns with acceptance criteria
   - Time estimates per phase
   - Deployment checklist
   - Success metrics
   - Risk mitigation strategies

3. **[Data Models](./DATA_MODELS.md)**
   - Payload CMS collection schemas
   - Field definitions and validations
   - Access control rules
   - Hooks and business logic
   - Database relationships
   - TypeScript type definitions
   - Example documents

4. **[Workflow Logic](./WORKFLOW_LOGIC.md)**
   - State machine diagrams
   - Business rules and validations
   - Automatic approval system
   - Revision tracking logic
   - Payment enforcement rules
   - Notification triggers
   - Edge case handling

---

## 🚀 Quick Start

### For Developers

1. **Read First:**
   - [Project Architecture](./PROJECT_ARCHITECTURE.md) - Understand the system
   - [Data Models](./DATA_MODELS.md) - Learn the data structures

2. **Implementation:**
   - Follow [Implementation Plan](./IMPLEMENTATION_PLAN.md) phase by phase
   - Reference [Workflow Logic](./WORKFLOW_LOGIC.md) for business rules

3. **Development Setup:**
   ```bash
   # Install dependencies
   pnpm install

   # Set up environment variables
   cp .env.example .env

   # Run development server
   pnpm dev

   # Generate TypeScript types
   pnpm generate:types
   ```

### For Product Managers

1. **Understand the Workflow:**
   - Read [Workflow Logic](./WORKFLOW_LOGIC.md)
   - Review state diagrams and business rules

2. **Feature Overview:**
   - See [Implementation Plan](./IMPLEMENTATION_PLAN.md) for feature breakdown
   - Check Phase descriptions for functionality details

### For Designers

1. **UI Requirements:**
   - Review [Project Architecture](./PROJECT_ARCHITECTURE.md) → UI/UX Design Patterns
   - Check component inventory in architecture doc
   - Reference priority and status visual systems

2. **Component Specs:**
   - 53+ atomic components already available (shadcn/ui)
   - Kanban board system implemented
   - Sidebar navigation system complete

---

## 🎯 Key Features

### Client Features
✅ Create and manage tickets
✅ Set priority levels (Low, Medium, High, Absolute)
✅ Review and approve estimates
✅ Test completed features
✅ Request revisions (max 3 per ticket)
✅ Reorder ticket priorities
✅ View invoices and payment status

### Agency Features
✅ Provide estimates within 1 business day
✅ Track time spent on tickets
✅ Move tickets through workflow states
✅ Generate invoices from completed work
✅ View billing cycle summaries
✅ Monitor payment status

### Automated Features
✅ Auto-approval after 5 business days of no client action
✅ Payment reminders and enforcement
✅ Account suspension for overdue payments
✅ Real-time notifications
✅ Automatic time calculation
✅ Business day calculations (exclude weekends/holidays)

---

## 📊 Workflow States

| State | Description | Who Acts | Duration |
|-------|-------------|----------|----------|
| To Estimate | Awaiting estimate | Agency | <1 business day (SLA) |
| Needs Client Review | Awaiting approval | Client | No limit |
| Ready to Develop | In development queue | Agency | Based on priority |
| Development in Progress | Active development | Agency | Varies |
| Ready to Test | Awaiting client test | Client | 5 business days (auto-approve) |
| Done | Ready for billing | Agency | Until next invoice |
| Paid & Closed | Archived | N/A | Permanent |

---

## 🔒 Security & Access Control

### Role-Based Permissions

**Client Role:**
- ✅ Create tickets
- ✅ View own tickets only
- ✅ Approve/reject estimates
- ✅ Test features and request revisions
- ✅ View own invoices
- ❌ Cannot edit time logs
- ❌ Cannot access other clients' data

**Agency Role:**
- ✅ View all tickets
- ✅ Provide estimates
- ✅ Log time
- ✅ Move tickets through states
- ✅ Generate invoices
- ✅ View all billing data
- ❌ Cannot create tickets for clients

### Data Security
- Row-level security (RLS) in Supabase
- Server-side validation on all mutations
- Better Auth integration
- CSRF protection
- Input sanitization

---

## 📈 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Initial Page Load | <2 seconds | Code splitting, SSR |
| API Response Time | <100ms | Efficient queries, caching |
| Kanban Drag Performance | 60fps | Throttled events, optimistic updates |
| Real-time Update Latency | <500ms | Supabase subscriptions |
| Uptime | 99.9% | Vercel hosting, monitoring |

---

## 🧪 Testing Strategy

### Test Coverage

1. **Unit Tests (Vitest)**
   - Utility functions (date calculations)
   - Business logic (state transitions)
   - Validation schemas
   - Target: >70% coverage

2. **Integration Tests (Testing Library)**
   - Component rendering
   - Form submissions
   - Auth flows
   - Drag-drop functionality

3. **End-to-End Tests (Playwright)**
   - Complete user workflows
   - Authentication flows
   - Ticket lifecycle
   - Invoice generation
   - Automatic approval

---

## 🚢 Deployment

### Environment Variables Required

```env
# Database
DATABASE_URI=postgresql://...

# Payload CMS
PAYLOAD_SECRET=...
NEXT_PUBLIC_SERVER_URL=https://...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://...

# Email (Resend)
RESEND_API_KEY=...
FROM_EMAIL=noreply@...

# Stripe (Future)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Deployment Platforms

**Recommended:**
- **Frontend & API:** Vercel (optimized for Next.js)
- **Database:** Supabase (PostgreSQL + real-time)
- **Email:** Resend (transactional emails)
- **Monitoring:** Vercel Analytics + Sentry (optional)

### Cron Jobs

Configure in `vercel.json`:
- `/api/cron/auto-approve` - Daily at midnight UTC
- `/api/cron/check-payments` - Daily at midnight UTC

---

## 📅 Development Timeline

**Estimated Total Time:** 6-8 weeks (single full-time developer)

### Phase Breakdown

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 2-3 days | Foundation & Authentication |
| Phase 2 | 1-2 days | Application Shell & Navigation |
| Phase 3 | 2-3 days | Data Models & Collections |
| Phase 4 | 3-4 days | Kanban Board Implementation |
| Phase 5 | 3-4 days | Ticket Management Features |
| Phase 6 | 2 days | Time Tracking & Logging |
| Phase 7 | 2-3 days | Automatic Approval System |
| Phase 8 | 2-3 days | Invoice Management |
| Phase 9 | 2 days | Dashboard & Analytics |
| Phase 10 | 2 days | Notifications & Alerts |
| Phase 11 | 2-3 days | Polish & Optimization |
| Phase 12 | 2-3 days | Testing & Documentation |

---

## 🛠️ Tech Stack

### Core
- **Next.js 15.4.4** - React framework
- **TypeScript 5.7.3** - Type safety
- **Tailwind CSS 4.1.15** - Styling
- **Payload CMS 3.60.0** - Headless CMS
- **Better Auth 1.3.28** - Authentication
- **PostgreSQL** - Database (via Supabase)

### UI Components
- **shadcn/ui** - 53+ pre-built components
- **Radix UI** - Accessible primitives
- **Framer Motion** - Animations
- **dnd-kit** - Drag and drop
- **Lucide React** - Icons

### State Management
- **TanStack React Query** - Server state
- **Zustand** - Client state
- **React Hook Form** - Forms
- **Zod** - Validation

### Tools
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Linting
- **Prettier** - Code formatting

---

## 📖 Additional Resources

### Internal Links
- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - Claude Code configuration
- [Package.json](../package.json) - Dependencies

### External Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Payload CMS Docs](https://payloadcms.com/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)

### Useful Commands
```bash
# Development
pnpm dev                 # Start dev server
pnpm build               # Build for production
pnpm start               # Start production server

# Payload CMS
pnpm generate:types      # Generate TS types
pnpm payload             # Payload CLI

# Testing
pnpm test               # Run all tests
pnpm test:int           # Unit tests
pnpm test:e2e           # E2E tests

# Claude Code
pnpm claude:setup       # Complete setup
pnpm claude:verify      # Verify setup
```

---

## 🤝 Contributing

### Development Workflow

1. **Pick a Phase:** Start with Phase 1 in [Implementation Plan](./IMPLEMENTATION_PLAN.md)
2. **Create Branch:** `git checkout -b phase-1-authentication`
3. **Implement Features:** Follow acceptance criteria
4. **Write Tests:** Unit + E2E tests
5. **Create PR:** Reference phase and tasks completed
6. **Review & Merge:** Code review + QA testing

### Code Standards

- Follow TypeScript strict mode
- Use ESLint + Prettier
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Maintain >70% test coverage
- Follow Atomic Design pattern for components

---

## ❓ FAQ

### Q: Why Better Auth instead of NextAuth?
A: Better Auth provides simpler integration with Payload CMS via the `payload-auth` plugin and offers more flexibility for custom authentication flows.

### Q: Why Payload CMS instead of direct database access?
A: Payload provides a robust admin panel, automatic API generation, built-in access control, and type safety, significantly reducing development time.

### Q: Can I use a different database besides PostgreSQL?
A: Payload supports multiple databases, but PostgreSQL is recommended for its advanced features and excellent Supabase integration.

### Q: How does automatic approval work on weekends?
A: Business day calculations automatically skip weekends and holidays, so deadlines extend to the next business day.

### Q: What happens if a client is suspended?
A: Suspended clients cannot create new tickets, but can view existing tickets and make payments to restore access.

### Q: Can I customize the revision limit?
A: Yes, the revision limit (currently 3) can be made configurable per project or client in the future.

---

## 🐛 Known Issues & Limitations

### Current Limitations
- Email notifications not yet implemented (Phase 10)
- Slack integration planned for Phase 2 (future)
- Stripe payment processing not yet implemented
- Multi-organization support not available (single tenant)
- No mobile app (web-only currently)

### Planned Enhancements
- [ ] Email templates with Resend
- [ ] Slack webhook notifications
- [ ] Automated Stripe billing
- [ ] Time tracking widgets (start/stop timers)
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant organization support
- [ ] Mobile app (React Native)

---

## 📞 Support

### Documentation Issues
If you find errors or gaps in this documentation:
1. Open an issue in the project repository
2. Provide specific page and section references
3. Suggest improvements or corrections

### Development Questions
For development questions:
1. Check the relevant documentation first
2. Review code examples in the docs
3. Search existing issues
4. Open a new discussion if needed

---

## 📜 License

[Add your license information here]

---

## 🙏 Acknowledgments

- **Payload CMS Team** - Excellent headless CMS
- **Shadcn** - Beautiful component library
- **Vercel** - Seamless Next.js hosting
- **Supabase** - PostgreSQL + real-time features
- **Better Auth** - Modern auth solution

---

**Documentation Version:** 1.0.0
**Last Updated:** 2025-10-22
**Maintained By:** Development Team

---

## 📋 Document Checklist

✅ Project Architecture
✅ Implementation Plan (12 phases)
✅ Data Models (4 collections)
✅ Workflow Logic (8 states, business rules)
✅ README (this file)

**Status:** Complete - Ready for development Phase 1 🚀
