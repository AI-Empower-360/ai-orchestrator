# Organization Feature Documentation

## Overview

The Organization feature provides multi-tenancy support to the AI Orchestrator platform, allowing multiple healthcare organizations to use the system while keeping their data isolated.

## Features

- Create, read, update, and delete organizations
- Associate doctors with organizations
- Include organization context in authentication (JWT tokens)
- RESTful API endpoints for organization management

## API Endpoints

All organization endpoints require JWT authentication.

### List All Organizations

```http
GET /api/organizations
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "Default Organization",
    "createdAt": "2024-01-29T18:00:00.000Z"
  }
]
```

### Get Single Organization

```http
GET /api/organizations/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "1",
  "name": "Default Organization",
  "createdAt": "2024-01-29T18:00:00.000Z"
}
```

### Create Organization

```http
POST /api/organizations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Medical Center"
}
```

**Response:**
```json
{
  "id": "uuid-generated-id",
  "name": "New Medical Center",
  "createdAt": "2024-01-29T18:00:00.000Z"
}
```

### Update Organization

```http
PATCH /api/organizations/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Medical Center"
}
```

**Response:**
```json
{
  "id": "uuid-generated-id",
  "name": "Updated Medical Center",
  "createdAt": "2024-01-29T18:00:00.000Z",
  "updatedAt": "2024-01-29T19:00:00.000Z"
}
```

### Delete Organization

```http
DELETE /api/organizations/:id
Authorization: Bearer <jwt_token>
```

**Response:** 204 No Content

## Authentication Integration

When a doctor logs in, the response now includes organization information:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "1",
    "name": "Dr. John Smith",
    "email": "doctor@example.com",
    "organizationId": "1",
    "organizationName": "Default Organization"
  }
}
```

The JWT token payload also includes the organization ID:

```json
{
  "email": "doctor@example.com",
  "sub": "1",
  "organizationId": "1"
}
```

## Data Model

### Organization Interface

```typescript
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### Doctor Interface (Updated)

```typescript
export interface Doctor {
  id: string;
  email: string;
  password: string; // Hashed
  name: string;
  organizationId?: string;
  organizationName?: string;
  createdAt: Date;
}
```

## Current Implementation

The current implementation uses in-memory storage with a `Map` data structure. A default organization is created on service initialization:

```typescript
{
  id: '1',
  name: 'Default Organization',
  createdAt: new Date()
}
```

The mock doctor is associated with this default organization:

```typescript
{
  id: '1',
  email: 'doctor@example.com',
  name: 'Dr. John Smith',
  organizationId: '1',
  organizationName: 'Default Organization'
}
```

## Future Enhancements

- **Database Integration**: Replace in-memory storage with PostgreSQL/MySQL using TypeORM
- **Tenant Isolation**: Implement middleware to filter all queries by organization ID
- **Organization Settings**: Add configuration options per organization (branding, features, etc.)
- **User Roles**: Implement organization-level and system-level admin roles
- **Billing**: Add subscription and billing management per organization
- **Multi-tenancy**: Full data isolation with organization-scoped queries across all modules

## Testing

The organization feature includes comprehensive unit tests:

- Service tests (7 tests)
- Controller tests (6 tests)

Run tests with:

```bash
npm test -- organization
```

All 13 tests should pass successfully.

## Migration Path

To migrate existing data:

1. All existing doctors will be associated with the default organization (ID: "1")
2. New organizations can be created via the API
3. Doctors can be reassigned to different organizations by updating the `organizationId` field
4. Session data and other entities can be scoped to organizations in future iterations

## Security Considerations

- Organization endpoints are protected by JWT authentication
- Currently, any authenticated user can view and manage all organizations
- Future implementation should add organization-scoped permissions
- Organization admins should only manage their own organization
- System admins should have access to all organizations
