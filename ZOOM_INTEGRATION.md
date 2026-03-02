# Zoom Integration Guide

## Overview

The Meeting Service automatically creates Zoom meetings when a meeting is created with status `SCHEDULED`. Zoom meeting details (join URL, start URL, password) are stored in the database and returned in the API response.

---

## Setup Instructions

### 1. Get Zoom API Credentials

**Option A: Account-level OAuth (Recommended for Production)


1
1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a Server-to-Server OAuth app
3. Get:
   - **API Key** (`ZOOM_API_KEY`)
   - **API Secret** (`ZOOM_API_SECRET`)
   - **Account ID** (`ZOOM_ACCOUNT_ID`)

**Option B: JWT App (For Development/Testing)**

1. Create a JWT app in Zoom Marketplace
2. Get:
   - **API Key** (`ZOOM_API_KEY`)
   - **API Secret** (`ZOOM_API_SECRET`)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Zoom API Configuration
ZOOM_API_KEY="your-zoom-api-key"
ZOOM_API_SECRET="your-zoom-api-secret"
ZOOM_ACCOUNT_ID="your-zoom-account-id"  # Required for Account-level OAuth
ZOOM_USER_ID="me"  # Optional, defaults to "me" (account owner)
```

**Note:** If Zoom credentials are not configured, the service will continue to work but Zoom meetings won't be created (warning logged).

---

## How It Works

### Automatic Zoom Meeting Creation

When you create a meeting with `status: "SCHEDULED"`:

1. Meeting is created in the database
2. Zoom meeting is automatically created via Zoom API
3. Zoom details are saved:
   - `zoomMeetingId` — Zoom meeting ID
   - `zoomJoinUrl` — URL for participants to join
   - `zoomStartUrl` — URL for host to start the meeting
   - `zoomPassword` — Meeting password (if set)

### Example Flow

**Request:**
```json
POST /meetings
{
  "title": "Team Sync",
  "startTime": "2026-02-20T10:00:00.000Z",
  "endTime": "2026-02-20T11:00:00.000Z",
  "status": "SCHEDULED"
}
```

**Response includes Zoom data:**
```json
{
  "id": "meeting-uuid",
  "title": "Team Sync",
  "status": "SCHEDULED",
  "zoomMeetingId": "123456789",
  "zoomJoinUrl": "https://zoom.us/j/123456789",
  "zoomStartUrl": "https://zoom.us/s/123456789?zak=...",
  "zoomPassword": "123456",
  ...
}
```

---

## Zoom Meeting Settings

Default settings applied when creating Zoom meetings:

- **Type:** Scheduled meeting (type 2)
- **Host video:** Enabled
- **Participant video:** Enabled
- **Join before host:** Disabled
- **Mute upon entry:** Disabled
- **Waiting room:** Disabled
- **Duration:** Calculated from `startTime` and `endTime`

These can be customized in `src/zoom/zoom.service.ts` → `createMeeting()` method.

---

## Automatic Cleanup

When a meeting is **deleted** (`DELETE /meetings/:id`):

- The Zoom meeting is automatically deleted from Zoom
- If Zoom deletion fails, the meeting is still deleted from the database (error logged)

---

## Error Handling

- If Zoom API fails during meeting creation:
  - Meeting is still created in the database
  - Error is logged
  - API returns the meeting without Zoom data

- If Zoom credentials are missing:
  - Service continues to work normally
  - Warning logged: "Zoom credentials not configured"
  - No Zoom meetings created

---

## Frontend Integration

The frontend can use the Zoom URLs returned in the meeting response:

- **`zoomJoinUrl`** — Show to participants (anyone can join)
- **`zoomStartUrl`** — Show to organizers/host (starts the meeting)
- **`zoomPassword`** — Display if required

Example:
```javascript
// Get meeting
const meeting = await fetch('/meetings/123');

// Show join link to participants
if (meeting.zoomJoinUrl) {
  console.log('Join: ' + meeting.zoomJoinUrl);
}

// Show start link to organizers
if (meeting.zoomStartUrl && isOrganizer) {
  console.log('Start: ' + meeting.zoomStartUrl);
}
```

---

## Testing Without Zoom

To test without Zoom integration:

1. Don't add Zoom credentials to `.env`
2. Create meetings normally
3. Meetings will be created without Zoom data
4. Service works normally

---

## Troubleshooting

**Zoom meeting not created:**
- Check Zoom credentials in `.env`
- Check logs for Zoom API errors
- Verify meeting status is `SCHEDULED` (not `DRAFT`)

**"JWT library not found" error:**
- Install: `npm install jsonwebtoken @types/jsonwebtoken`
- Or use Account-level OAuth (set `ZOOM_ACCOUNT_ID`)

**Zoom API authentication fails:**
- Verify API Key and Secret are correct
- For Account-level OAuth, ensure `ZOOM_ACCOUNT_ID` is set
- Check Zoom app permissions in Zoom Marketplace
