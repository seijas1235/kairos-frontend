# KAIROS Frontend

**AI-Powered Adaptive Learning Platform - Angular Frontend**

>  **Backend Repository:** [kairos-backend](https://github.com/seijas1235/kairos-backend)

KAIROS is an intelligent learning platform that adapts educational content in real-time based on learning behavior analysis, powered by Gemini 3.

---

## Features

### Core Functionality
- **Real-time visual signal analysis** - Incurs learning-related states such as confusion or disengagement
- **Adaptive Content Delivery** - Dynamic content adjustment based on student state
- **Interactive Learning Sessions** - Multimodal content (text, images, videos)
- **Learning Path Visualization** - Progress tracking and topic navigation
- **Multi-Language Support** - English, Spanish, and Portuguese (i18n)

### UI/UX
- **Modern Design** - Clean, professional interface with KAIROS branding
- **Responsive Layout** - Works on desktop and tablet devices
- **Visual Feedback System** - Real-time indicator of inferred student state
- **Dark Mode Support** - Comfortable viewing in any environment
- **Accessibility** - WCAG compliant design patterns

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Backend running** on `http://localhost:8000` ([Setup instructions](https://github.com/seijas1235/kairos-backend))

### Installation

1. **Clone and navigate:**
   ```bash
   git clone https://github.com/seijas1235/kairos-frontend.git
   cd kairos-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   Navigate to `http://localhost:4200`

---

## Project Structure

```
kairos-frontend-v2/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services and models
│   │   │   ├── services/
│   │   │   │   ├── real-time.service.ts      # WebSocket communication
│   │   │   │   ├── emotion-detection.ts      # Emotion processing
│   │   │   │   ├── camera.ts                 # Camera management
│   │   │   │   └── i18n.ts                   # Internationalization
│   │   │   └── models/
│   │   │       └── emotion.model.ts          # Emotion types
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── home/                # Landing page
│   │   │   ├── lesson-creator/      # Create new lessons
│   │   │   ├── learning-session/    # Active learning session
│   │   │   └── dashboard/           # Progress dashboard
│   │   │
│   │   └── shared/                  # Shared components
│   │       ├── navbar/
│   │       ├── footer/
│   │       └── emotion-indicator/   # Real-time emotion display
│   │
│   ├── assets/                      # Static assets
│   │   ├── i18n/                    # Translation files
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   └── pt.json
│   │   └── demo/                    # Demo resources
│   │
│   ├── styles/                      # Global styles
│   │   ├── _variables.scss          # Design tokens
│   │   └── styles.scss              # Global CSS
│   │
│   └── environments/                # Environment configs
│       ├── environment.ts           # Development
│       └── environment.prod.ts      # Production
│
├── public/                          # Public assets
│   └── favicon.svg                  # KAIROS favicon
│
└── package.json                     # Dependencies
```

---

## Backend Integration

### WebSocket Connection

The frontend connects to the backend via WebSocket for real-time communication:

```typescript
// Automatic connection on session start
const ws = new WebSocket('ws://localhost:8000/ws/session/');
```

### Message Flow

#### 1. Starting a Lesson
```typescript
// Frontend sends
{
  "type": "start_lesson",
  "topic": "Mathematics",
  "difficulty": "intermediate",
  "learning_style": "visual"
}

// Backend responds with learning path and content
{
  "type": "learning_path",
  "data": { ... }
}
```

#### 2. Emotion Detection
```typescript
// Frontend sends (every 3 seconds)
{
  "type": "emotion_frame",
  "frame": "base64_encoded_image",
  "timestamp": "2026-02-09T12:00:00Z"
}

// Backend responds
{
  "type": "emotion_detected",
  "emotion": "confused",
  "confidence": 0.85
}
```

#### 3. Content Delivery
```typescript
// Backend sends adaptive content
{
  "type": "lesson_content",
  "content": [
    { "type": "text", "content": "..." },
    { "type": "image_prompt", "content": "..." },
    { "type": "video_url", "content": "https://..." }
  ]
}
```

---

## How to Use

### Creating a Lesson

1. **Navigate to Lesson Creator** from the home page
2. **Enter any topic** you want to learn about:
   - Examples: "Black Holes", "Photosynthesis", "French Revolution", "Quantum Mechanics"
3. **Click "Start Learning"**

### Interactive Learning Experience

Once your lesson starts, KAIROS adapts in real-time based on learning behavior analysis:

#### Engagement Analysis
- If the system detects signs of confusion, it automatically simplifies the explanation.
- Content adapts with visual aids, analogies, or videos to support understanding.
- The indicator provides visual feedback when adaptation occurs.

#### Comprehension Tracking
- When engagement is high, the system continues with the planned learning depth.
- KAIROS optimizes the content flow based on steady comprehension.
- More advanced concepts are introduced as the student progresses.

### Example: Learning About Black Holes

**Topic:** `EVENT HORIZON`

**What Happens:**
1. System presents theoretical concepts about General Relativity
2. You look confused → KAIROS detects it
3. Content adapts with a simple fabric analogy and NASA video
4. You smile after understanding → System confirms comprehension
5. Lesson continues with more advanced topics

**Real-Time Feedback:**
- Monitor the visual indicator for real-time status updates
- Track your learning path progress in the dashboard
- Content adjusts automatically based on inferred cognitive states

---

## Internationalization

KAIROS supports multiple languages out of the box:

### Available Languages
- **English** (default)
- **Spanish** (Español)
- **Portuguese** (Português)

### Switching Languages
Users can change language via the navbar dropdown. All UI text updates instantly.

### Translation Files
Located in `src/assets/i18n/`:
- `en.json` - English translations
- `es.json` - Spanish translations
- `pt.json` - Portuguese translations

---

## Design System

### Color Palette
```scss
$primary-color: #6366f1;    // Indigo
$secondary-color: #8b5cf6;  // Purple
$success-color: #10b981;    // Green
$warning-color: #f59e0b;    // Amber
$error-color: #ef4444;      // Red
```

### Typography
- **Headings:** Poppins (Google Fonts)
- **Body:** Inter (Google Fonts)

### Components
All components follow a consistent design language with:
- 8px spacing grid
- Smooth transitions (250ms ease-in-out)
- Subtle shadows and hover effects
- Accessible color contrasts (WCAG AA)

---

## Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

### Environment Configuration

**Development** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  wsUrl: 'ws://localhost:8000/ws/session/',
  emotionDetectionInterval: 3000,
  demoMode: false
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  wsUrl: 'wss://your-domain.com/ws/session/',
  emotionDetectionInterval: 3000,
  demoMode: false
};
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Output will be in `dist/kairos-frontend-v2/browser/`

### Deployment Options

#### 1. Static Hosting (Netlify, Vercel)
```bash
# Build
npm run build

# Deploy dist folder
netlify deploy --prod --dir=dist/kairos-frontend-v2/browser
```

#### 2. Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist/kairos-frontend-v2/browser /usr/share/nginx/html
```

---

## Privacy & Security

- **No video storage** - Camera frames processed in-memory only
- **Client-side processing** - Emotion data sent to backend but not persisted
- **Secure WebSocket** - WSS in production
- **CORS configured** - Backend only accepts requests from frontend domain

---

## Built With

- **Angular 21** - Modern web framework
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming
- **SCSS** - Advanced styling
- **Bootstrap Icons** - Icon library
- **WebSocket API** - Real-time communication

---

## Support

For issues or questions:
1. Check [Backend Documentation](https://github.com/seijas1235/kairos-backend)
2. Review WebSocket message contracts
3. Test camera permissions in browser

---

## Ready to Learn!

**Status**: Production-ready adaptive learning platform

**Quick Start**:
1. Ensure backend is running with Daphne
2. Run `npm start`
3. Navigate to `http://localhost:4200`
4. Try the demo with topic: `EVENT HORIZON`

---