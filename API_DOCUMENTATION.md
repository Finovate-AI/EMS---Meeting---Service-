# Meeting Service — API Documentation

Documentation for the Frontend team. Base URL and authentication apply to all endpoints below.

---

## Base URL & Authentication

| Item | Value |
|------|--------|
| **Base URL** | `{MEETING_SERVICE_URL}` (e.g. `http://localhost:3000`) |
| **Authentication** | Send header: **`x-secret-key`** on every request (value from Auth/API Gateway). |
| **Content-Type** | `application/json` for request bodies. |

---

## Concepts

- **Meeting** — An event with title, description, start/end time, and status.
- **Organizer** — User who can update/cancel the meeting and add/remove participants. The meeting creator is always an organizer.
- **Participant** — User added to the meeting; they can set their response (Accept / Decline / Tentative).
- **Meeting status** — `DRAFT` (default), `SCHEDULED`, or `CANCELLED`.
- **Participant response** — `ACCEPTED`, `DECLINED`, or `TENTATIVE` (optional, set by the participant).

---

## Endpoints

### 1. Create a meeting

**`POST /meetings`**

Creates a new meeting. The authenticated user is automatically added as an organizer. Default status is `DRAFT`.

**Who can call:** Any authenticated user.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Meeting title. |
| description | string | No | Meeting description. |
| startTime | string | Yes | Start time, ISO 8601 (e.g. `2026-02-20T10:00:00.000Z`). |
| endTime | string | Yes | End time, ISO 8601. |
| status | string | No | `DRAFT`, `SCHEDULED`, or `CANCELLED`. Default: `DRAFT`. |
| participants | array | No | List of `{ userId: string }` to add as participants. |
| organizers | array | No | List of `{ userId: string }`. Creator is always added as organizer. |

**Example:**

```json
{
  "title": "Weekly Sync",
  "description": "Q1 review",
  "startTime": "2026-02-20T10:00:00.000Z",
  "endTime": "2026-02-20T11:00:00.000Z",
  "status": "SCHEDULED",
  "participants": [{ "userId": "user-123" }, { "userId": "user-456" }]
}
```

**Response:** `201 Created` — Full meeting object (including `id`, participants, organizers, etc.).

**Errors:** `401` Unauthorized (missing or invalid `x-secret-key`).

---

### 2. Get all meetings

**`GET /meetings`**

Returns all meetings where the current user is creator, participant, or organizer. Sorted by start time (newest first).

**Who can call:** Any authenticated user.

**Query parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filter by status: `DRAFT`, `SCHEDULED`, or `CANCELLED`. |

**Examples:**

- `GET /meetings` — All my meetings.
- `GET /meetings?status=SCHEDULED` — Only scheduled meetings.
- `GET /meetings?status=DRAFT` — Only drafts.

**Response:** `200 OK` — Array of meeting objects.

**Errors:** `401` Unauthorized.

---

### 3. Get one meeting

**`GET /meetings/:id`**

Returns full details for a single meeting (including participants, organizers, and any related data). The user must be creator, participant, or organizer.

**Who can call:** Creator, any organizer, or any participant of that meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Response:** `200 OK` — Single meeting object.

**Errors:** `401` Unauthorized, `403` Forbidden (no access), `404` Not Found.

---

### 4. Get meeting participants

**`GET /meetings/:id/participants`**

Returns only the list of participants for a meeting (ids, userId, response, timestamps). Same access rule as “get one meeting”.

**Who can call:** Creator, any organizer, or any participant of that meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Response:** `200 OK` — Array of participant objects, e.g.:

```json
[
  {
    "id": "participant-uuid",
    "meetingId": "meeting-uuid",
    "userId": "user-123",
    "response": "ACCEPTED",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Errors:** `401` Unauthorized, `403` Forbidden, `404` Not Found.

---

### 5. Update a meeting

**`PATCH /meetings/:id`**

Updates meeting fields. All body fields are optional; only sent fields are updated.

**Who can call:** Only organizers of the meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Request body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| title | string | New title. |
| description | string | New description. |
| startTime | string | New start time (ISO 8601). |
| endTime | string | New end time (ISO 8601). |
| status | string | `DRAFT`, `SCHEDULED`, or `CANCELLED`. |

**Example:** `{ "title": "New Title", "status": "SCHEDULED" }`

**Response:** `200 OK` — Updated meeting object.

**Errors:** `401` Unauthorized, `403` Forbidden (not organizer), `404` Not Found.

---

### 6. Delete a meeting

**`DELETE /meetings/:id`**

Permanently deletes the meeting and all related data (participants, etc.).

**Who can call:** Only organizers of the meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Response:** `204 No Content` (no body).

**Errors:** `401` Unauthorized, `403` Forbidden (not organizer), `404` Not Found.

---

### 7. Cancel a meeting

**`POST /meetings/:id/cancel`**

Sets the meeting status to `CANCELLED`. Does not delete the meeting.

**Who can call:** Only organizers of the meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Request body:** None.

**Response:** `200 OK` — Meeting object with `status: "CANCELLED"`.

**Errors:** `400` Bad Request (already cancelled), `401` Unauthorized, `403` Forbidden, `404` Not Found.

---

### 8. Add a participant

**`POST /meetings/:id/participants`**

Adds a user as a participant to the meeting. They can later set their response (Accept/Decline/Tentative) via the update-participant endpoint.

**Who can call:** Only organizers of the meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | User ID (from Auth/User service) to add. |

**Example:** `{ "userId": "user-789" }`

**Response:** `201 Created` — Full meeting object (including the new participant).

**Errors:** `400` Bad Request (user already a participant), `401` Unauthorized, `403` Forbidden, `404` Not Found.

---

### 9. Update participant response (Accept / Decline / Tentative)

**`PATCH /meetings/:id/participants/:participantId`**

Updates the invitation response for one participant. Only that participant can update their own response.

**Who can call:** Only the participant whose record is `participantId` (current user’s `userId` must match that participant’s `userId`).

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |
| participantId | Participant record UUID (from GET meeting or GET participants). |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| response | string | No | `ACCEPTED`, `DECLINED`, or `TENTATIVE`. |

**Examples:**

- Accept: `{ "response": "ACCEPTED" }`
- Decline: `{ "response": "DECLINED" }`
- Tentative: `{ "response": "TENTATIVE" }`

**Response:** `200 OK` — Full meeting object.

**Errors:** `401` Unauthorized, `403` Forbidden (not this participant), `404` Not Found.

---

### 10. Remove a participant

**`DELETE /meetings/:id/participants/:participantId`**

Removes a participant from the meeting.

**Who can call:** Only organizers of the meeting.

**Path parameters:**

| Name | Description |
|------|-------------|
| id | Meeting UUID. |
| participantId | Participant record UUID. |

**Request body:** None.

**Response:** `204 No Content` (no body).

**Errors:** `401` Unauthorized, `403` Forbidden (not organizer), `404` Not Found.

---

## Summary table

| Method | Path | Description | Main permission |
|--------|------|-------------|-----------------|
| POST | `/meetings` | Create meeting | Any user |
| GET | `/meetings` | List my meetings (optional `?status=`) | Any user |
| GET | `/meetings/:id` | Get one meeting | Creator / Organizer / Participant |
| GET | `/meetings/:id/participants` | Get participants list | Creator / Organizer / Participant |
| PATCH | `/meetings/:id` | Update meeting | Organizer only |
| DELETE | `/meetings/:id` | Delete meeting | Organizer only |
| POST | `/meetings/:id/cancel` | Cancel meeting | Organizer only |
| POST | `/meetings/:id/participants` | Add participant | Organizer only |
| PATCH | `/meetings/:id/participants/:participantId` | Set Accept/Decline/Tentative | That participant only |
| DELETE | `/meetings/:id/participants/:participantId` | Remove participant | Organizer only |

---

## Enums reference

**Meeting status**

- `DRAFT` — Draft (default when creating).
- `SCHEDULED` — Scheduled.
- `CANCELLED` — Cancelled.

**Participant response**

- `ACCEPTED` — Accepted invitation.
- `DECLINED` — Declined invitation.
- `TENTATIVE` — Maybe / tentative.

---

## Notes for frontend

1. **IDs** — Meeting `id` and `participantId` are UUIDs. Use the same `id` in path params as returned by the API.
2. **Dates** — Send and receive times in ISO 8601 format (e.g. `2026-02-20T10:00:00.000Z`).
3. **User IDs** — `userId` and `createdBy` refer to users from the Auth/User service; this API does not return user profile data.
4. **Swagger** — Interactive docs available at `{BASE_URL}/api` when the service is running.
