# Time & Materials Project Management System

A complete Time & Materials project management system with client portal, time tracking, invoicing, and Stripe payments.

## Features

- **Client Portal** - Ticket submission, progress tracking, invoice payments
- **Admin Dashboard** - Kanban board, time tracking with timer, invoice generation
- **Workflow Management** - 8-state ticket workflow with approvals and revisions
- **Time Tracking** - Built-in timer, automatic rounding, billable/non-billable tracking
- **Invoicing** - Auto-generated invoices with Stripe integration
- **Notifications** - Email and in-app notifications for all events
- **Access Control** - Role-based permissions (Admin/Client)

## Tech Stack

- **Next.js 15** - App Router with Server Actions
- **Payload CMS v3** - Headless CMS with PostgreSQL
- **Better Auth** - Authentication with email/password
- **Stripe** - Payment processing
- **shadcn/ui** - UI components with Tailwind CSS
- **TanStack Query** - Data fetching and caching

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**
   ```bash
   # Local PostgreSQL
   createdb ns-webapp

   # Or use the provided connection string for Supabase
   ```

4. **Generate types**
   ```bash
   pnpm run generate:types
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and deployment guide
- **[docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)** - System architecture
- **[docs/DATA_MODELS.md](docs/DATA_MODELS.md)** - Database schemas
- **[docs/WORKFLOW_LOGIC.md](docs/WORKFLOW_LOGIC.md)** - Business rules and workflows
- **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - Development roadmap

#### Docker (Optional)

If you prefer to use Docker for local development instead of a local MongoDB instance, the provided docker-compose.yml file can be used.

To do so, follow these steps:

- Modify the `MONGODB_URI` in your `.env` file to `mongodb://127.0.0.1/<dbname>`
- Modify the `docker-compose.yml` file's `MONGODB_URI` to match the above `<dbname>`
- Run `docker-compose up` to start the database, optionally pass `-d` to run in the background.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
