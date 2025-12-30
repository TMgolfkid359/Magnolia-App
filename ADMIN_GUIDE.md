# Admin Guide - Magnolia Flight Portal

## Admin Login

**Credentials:**
- Email: `admin@magnolia.com`
- Password: `password`

## Admin Features

### Accessing Admin Dashboard

1. Log in with admin credentials
2. You'll see an "Admin" menu item in the sidebar
3. Click "Admin" to access the admin dashboard

### Managing Videos

#### Adding a New Video

1. Click "Add Video" button
2. Fill in the form:
   - **Title** (required): Name of the video
   - **Category**: Choose from Ground, Flight, Safety, or Systems
   - **Duration**: Format like "45:30"
   - **Date**: When the video was created/recorded
   - **Instructor**: Name of the instructor (optional)
   - **Video URL** (required): YouTube embed URL
     - Format: `https://www.youtube.com/embed/VIDEO_ID`
     - To get this: Go to your YouTube video → Share → Embed → Copy the src URL
   - **Description**: Brief description of the video content
3. Click "Save Video"

#### Editing a Video

1. Find the video in the list
2. Click the "Edit" icon (pencil)
3. Modify the fields
4. Click "Save Video"

#### Deleting a Video

1. Find the video in the list
2. Click the "Delete" icon (trash)
3. Confirm deletion

### Video Storage

- Videos are stored in browser localStorage
- Changes persist across sessions
- To reset videos, clear browser localStorage or use browser dev tools

### YouTube Video URL Format

To add a YouTube video:
1. Go to your YouTube video
2. Click "Share" → "Embed"
3. Copy the URL from the `src` attribute
4. It should look like: `https://www.youtube.com/embed/dQw4w9WgXcQ`

**Note:** Make sure to use the embed URL, not the regular watch URL!

## Logo

The logo has been updated to match your brand:
- Dark green curved/triangular shape
- Black outline magnolia flower overlaid
- Classic serif "MAGNOLIA" text

## Future Enhancements

The video service is designed to easily connect to a backend API. Currently it uses localStorage, but you can replace the `videoService` functions with API calls when ready.

