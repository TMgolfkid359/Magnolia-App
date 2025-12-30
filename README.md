# Magnolia Flight Portal

A comprehensive portal for students and instructors that integrates with Flight Schedule Pro (FSP) to provide schedule management, course materials, and video lessons.

## Features

- **Student/Instructor Authentication**: Role-based access control
- **Flight Schedule Integration**: Connects to Flight Schedule Pro API to display student schedules
- **Course Management**: Pre-course materials (like indoc) that students must complete before starting
- **Video Portal**: Access to previous lessons and training videos with search and filtering

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Flight Schedule Pro API credentials (optional for development - uses mock data)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FSP_API_URL=https://api.flightschedulepro.com
NEXT_PUBLIC_FSP_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Credentials

- **Student**: `student@example.com` / `password`
- **Instructor**: `instructor@example.com` / `password`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   │   ├── courses/       # Course/indoc page
│   │   ├── videos/        # Video portal page
│   │   └── page.tsx       # Schedule page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Login page
├── components/            # React components
│   ├── DashboardLayout.tsx
│   └── LoginPage.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
└── services/              # API services
    └── fspApi.ts          # Flight Schedule Pro API integration
```

## Flight Schedule Pro Integration

The portal integrates with Flight Schedule Pro's API to fetch and display schedules. The integration is configured in `services/fspApi.ts`.

### API Endpoints Used

- `GET /api/v1/students/{studentId}/schedule` - Get student schedule
- `GET /api/v1/instructors/{instructorId}/schedule` - Get instructor schedule
- `POST /api/v1/schedules` - Create new schedule

For development, the app uses mock data. Replace the mock implementations with actual API calls when connecting to your FSP instance.

## Features in Detail

### Schedule View
- Displays upcoming and past flights
- Shows flight details: date, time, aircraft, instructor
- Color-coded by flight type (lesson, solo, checkride)
- Status indicators (scheduled, completed, cancelled)

### Courses Section
- Required courses (like indoc) that must be completed before training
- Course materials (documents, videos, quizzes)
- Progress tracking
- Completion status

### Video Portal
- Searchable video library
- Category filtering (ground, flight, safety, systems)
- Video player with lesson details
- Previous lessons archive

## Customization

### Adding New Courses
Edit `app/dashboard/courses/page.tsx` to add new course entries in the `mockCourses` array.

### Adding Videos
Edit `app/dashboard/videos/page.tsx` to add new video entries in the `mockVideos` array.

### Styling
The app uses Tailwind CSS. Customize colors in `tailwind.config.js`.

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Or deploy to platforms like Vercel, which has excellent Next.js support.

## Security Notes

- Replace mock authentication with a proper authentication system
- Store API keys securely (use environment variables)
- Implement proper session management
- Add CSRF protection
- Validate all user inputs

## License

This project is proprietary software for Magnolia Flight School.

