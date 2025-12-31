# Flight Schedule Pro Integration Guide

This guide explains how to integrate your Magnolia Portal with Flight Schedule Pro (FSP) so students can view their flight schedules.

## Prerequisites

1. A Flight Schedule Pro account with API access enabled
2. API credentials from Flight Schedule Pro (API key or OAuth tokens)
3. Access to your FSP student/instructor IDs

## Step 1: Get Your FSP API Credentials

1. Log in to your Flight Schedule Pro account
2. Navigate to **Settings** → **API/Integrations** or **Developer Settings**
3. Generate an API key or set up OAuth credentials
4. Note your API base URL (typically `https://api.flightschedulepro.com` or your custom domain)

## Step 2: Configure Environment Variables

### Local Development

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_FSP_API_URL=https://api.flightschedulepro.com
NEXT_PUBLIC_FSP_API_KEY=your_api_key_here
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_FSP_API_URL` = Your FSP API base URL
   - `NEXT_PUBLIC_FSP_API_KEY` = Your FSP API key

## Step 3: Map Users to FSP IDs

Each user in your portal needs to be linked to their FSP student or instructor ID.

### Option A: Via Admin Panel (Recommended)

1. Log in as an admin user
2. Go to **Admin** → **Users** tab
3. For each user, click the edit icon next to their FSP ID field
4. Enter the FSP Student ID or Instructor ID
5. Click save

### Option B: Programmatically

You can also set FSP IDs programmatically:

```typescript
import { userService } from '@/services/userService'

// Set FSP Student ID
userService.updateUserFspId('user-id', 'fsp-student-id-123')

// Set FSP Instructor ID
userService.updateUserFspId('user-id', undefined, 'fsp-instructor-id-456')
```

## Step 4: Find FSP Student/Instructor IDs

### Method 1: From FSP Web Interface

1. Log in to Flight Schedule Pro
2. Go to **Students** or **Instructors**
3. Click on a student/instructor
4. The ID is typically in the URL or profile page

### Method 2: Via FSP API

If you have API access, you can list all students:

```bash
GET /api/v1/students
```

Match students by email address to link them to portal users.

## Step 5: Test the Integration

1. Log in as a student with an FSP Student ID configured
2. Navigate to the **Schedule** page
3. You should see their flight schedule from Flight Schedule Pro

## API Response Format

The integration expects FSP API responses in one of these formats:

### Format 1: Direct array
```json
[
  {
    "id": "123",
    "student_id": "456",
    "date": "2024-01-15",
    "start_time": "09:00",
    "end_time": "10:00",
    "aircraft_id": "N12345",
    "type": "lesson",
    "status": "scheduled"
  }
]
```

### Format 2: Wrapped in data object
```json
{
  "data": [
    {
      "id": "123",
      "student_id": "456",
      ...
    }
  ]
}
```

### Format 3: Wrapped in schedules array
```json
{
  "schedules": [
    {
      "id": "123",
      "student_id": "456",
      ...
    }
  ]
}
```

The integration automatically handles all these formats.

## Customizing API Endpoints

If your FSP API uses different endpoints, update `services/fspApi.ts`:

```typescript
// For students
const response = await apiClient.get(`/api/v1/students/${fspStudentId}/schedule`)

// For instructors
const response = await apiClient.get(`/api/v1/instructors/${fspInstructorId}/schedule`)
```

Common alternative endpoints:
- `/api/v1/schedules?student_id={id}`
- `/v2/students/{id}/reservations`
- `/api/reservations?studentId={id}`

## Authentication Methods

### Bearer Token (Current Implementation)
```typescript
headers: {
  'Authorization': `Bearer ${FSP_API_KEY}`
}
```

### API Key Header (Alternative)
If FSP uses a different auth method, update `services/fspApi.ts`:

```typescript
headers: {
  'X-API-Key': FSP_API_KEY,
  // or
  'FSP-API-Key': FSP_API_KEY
}
```

## Troubleshooting

### No schedules showing

1. **Check API key**: Verify `NEXT_PUBLIC_FSP_API_KEY` is set correctly
2. **Check FSP ID**: Ensure the user has a valid FSP Student/Instructor ID
3. **Check API endpoint**: Verify the endpoint URL matches your FSP API
4. **Check browser console**: Look for API errors in the developer console

### API Authentication Errors

- Verify your API key is valid and not expired
- Check if your FSP account has API access enabled
- Ensure the API key has the correct permissions

### CORS Errors

If you see CORS errors, you may need to:
- Use a server-side API route (Next.js API route) to proxy requests
- Contact FSP support to whitelist your domain
- Use server-side rendering to fetch data

### Mock Data Still Showing

If you see mock data instead of real schedules:
- Check that `NEXT_PUBLIC_FSP_API_KEY` is set (not empty)
- Verify the API is returning data (check Network tab in browser)
- The system falls back to mock data in development mode if API fails

## Production Considerations

1. **Error Handling**: In production, failed API calls return empty arrays instead of mock data
2. **Rate Limiting**: Be aware of FSP API rate limits
3. **Caching**: Consider implementing caching for schedule data
4. **Security**: Never expose API keys in client-side code (use Next.js API routes if needed)

## Support

For FSP API-specific issues, consult:
- Flight Schedule Pro API Documentation
- Flight Schedule Pro Support Team

For portal integration issues, check:
- Browser console for errors
- Network tab for API request/response details
- Server logs (if using API routes)

