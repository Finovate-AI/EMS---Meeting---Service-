# Meeting Service

A microservices-based Meeting Service built with Nest.js and Prisma.

## Architecture

This service is responsible for managing meetings in a microservices architecture. It integrates with an Auth Service for authentication and authorization.

## Tech Stack

- **Nest.js** - Progressive Node.js framework
- **Prisma ORM** - Next-generation ORM for Node.js and TypeScript
- **SQL Server** - Database
- **REST API** - API architecture

## Features

- Global authentication guard that verifies secret keys with Auth Service
- Complete CRUD operations for meetings
- Meeting participants management
- Meeting organizers management
- Agenda items management
- Meeting minutes
- Action items tracking

## Prerequisites

- Node.js (v18 or higher)
- SQL Server database
- Auth Service running and accessible

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
DATABASE_URL="sqlserver://server:1433;database=database_name;user=username;password=password;encrypt=true;trustServerCertificate=true"
AUTH_SERVICE_URL="http://localhost:3001"
PORT=3000
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

All endpoints require the `x-secret-key` header for authentication.

### Meetings

- `POST /meetings` - Create a new meeting
- `GET /meetings` - Get all meetings (user's meetings only)
- `GET /meetings/:id` - Get a specific meeting
- `PATCH /meetings/:id` - Update a meeting (organizers only)
- `POST /meetings/:id/cancel` - Cancel a meeting (organizers only)

### Participants

- `POST /meetings/:id/participants` - Add a participant (organizers only)
- `PATCH /meetings/:id/participants/:participantId` - Update participant response (participant only)

### Agenda

- `POST /meetings/:id/agenda` - Add an agenda item (organizers only)

### Minutes

- `POST /meetings/:id/minutes` - Add/update meeting minutes (organizers only)

### Action Items

- `POST /meetings/:id/action-items` - Add an action item (organizers only)
- `GET /meetings/:id/action-items` - Get all action items for a meeting

## Business Rules

- Meeting Service does not store user data
- All authentication is delegated to Auth Service
- Only meeting organizers can update or cancel meetings
- Participants can only respond to invitations
- Meeting creator is automatically added as an organizer

## Database Schema

The service uses the following main tables:
- `meetings` - Meeting information
- `meeting_participants` - Meeting participants and their responses
- `meeting_organizers` - Meeting organizers
- `meeting_agenda_items` - Agenda items for meetings
- `meeting_minutes` - Meeting minutes and decisions
- `action_items` - Action items from meetings

## Security

- Global `AuthGuard` validates `x-secret-key` header
- Calls Auth Service `/verify` endpoint
- Attaches user information (`userId`, `roles`, `departmentId`) to request object
- Business logic enforces authorization rules

## Development

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
