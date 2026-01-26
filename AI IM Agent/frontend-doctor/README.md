# AI Med Frontend - Doctor Dashboard

A Next.js 14 frontend application for the AI Agentic Internal Medicine platform, providing doctors with a real-time dashboard for patient consultations, live transcription, SOAP notes, and clinical alerts.

## 🎯 Project Purpose

The Doctor Dashboard enables healthcare providers to:
- Conduct patient consultations with live audio recording
- Receive real-time transcription of conversations
- Generate and edit SOAP (Subjective, Objective, Assessment, Plan) notes
- Receive and manage clinical alerts
- Maintain HIPAA-compliant workflows

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Real-time:** WebSockets
- **Audio:** Web Audio API
- **State Management:** React Hooks

## 📁 Folder Structure

```
ai-med-frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages and layout
│   │   ├── layout.tsx     # Dashboard layout with header
│   │   └── page.tsx       # Main dashboard container
│   ├── login/             # Authentication
│   │   └── page.tsx       # Doctor login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to login)
├── components/            # React components
│   ├── alerts-panel.tsx   # Clinical alerts display
│   ├── notes-panel.tsx    # SOAP notes editor
│   ├── recording-controls.tsx  # Audio recording UI
│   └── transcription-panel.tsx # Live transcription display
├── lib/                   # Core libraries
│   ├── api-client.ts      # REST API client
│   └── websocket.ts       # WebSocket client
├── shared/                # Shared code
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   ├── useAudioRecorder.ts  # Audio recording hook
│   │   └── useWebSocket.ts      # WebSocket hook
│   └── ui/                # Reusable UI components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── spinner.tsx
├── API_CONTRACTS.md       # API and WebSocket schemas
├── HIPAA_COMPLIANCE.md    # HIPAA compliance documentation
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 Local Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (see `ai-med-backend` repository)
- Microphone access for recording features

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AI-Empower-360/ai-med-frontend.git
   cd ai-med-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   NEXT_PUBLIC_WS_BASE_URL=ws://localhost:3001
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for REST API | Yes | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_BASE_URL` | Base URL for WebSocket (ws:// or wss://) | No | Uses `NEXT_PUBLIC_API_BASE_URL` |

### Production Configuration

For production, set:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.aimed.example.com
NEXT_PUBLIC_WS_BASE_URL=wss://api.aimed.example.com
```

## 📡 API Integration

### Backend Requirements

The frontend expects the following backend endpoints:

- **Authentication:** `POST /auth/login`
- **SOAP Notes:** `GET /api/notes/:sessionId`, `PATCH /api/notes/:sessionId`
- **Alerts:** `GET /api/alerts`, `POST /api/alerts/:alertId/acknowledge`
- **WebSocket:** `wss://api.example.com/ws/transcription?token={JWT}`

See `API_CONTRACTS.md` for detailed API schemas and WebSocket event formats.

## 🔐 HIPAA Compliance

This application is designed with HIPAA compliance in mind:

- ✅ No PHI stored in browser storage (localStorage, sessionStorage, cookies)
- ✅ JWT tokens stored in memory only
- ✅ Secure WebSocket connections (WSS in production)
- ✅ Automatic data cleanup on logout
- ✅ No PHI in error messages or console logs

See `HIPAA_COMPLIANCE.md` for detailed compliance documentation.

## 🎨 Features

### Authentication
- Doctor login with email/password
- JWT token-based authentication
- Automatic session management
- Secure logout with data cleanup

### Live Transcription
- Real-time audio transcription
- Speaker identification
- Partial and final transcript display
- Auto-scrolling transcript panel

### SOAP Notes
- Structured note-taking (Subjective, Objective, Assessment, Plan)
- Live updates from AI analysis
- Manual editing capabilities
- Auto-save functionality

### Clinical Alerts
- Real-time alert notifications
- Severity levels (info, warning, critical)
- Alert acknowledgment workflow
- Visual hierarchy

### Audio Recording
- Web Audio API integration
- Real-time audio streaming to backend
- Mute/unmute functionality
- Pause/resume recording
- Microphone permission handling

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Structure

- **Components:** Reusable UI components in `components/` and `shared/ui/`
- **Hooks:** Custom React hooks in `shared/hooks/`
- **API Client:** Centralized API communication in `lib/api-client.ts`
- **WebSocket:** Real-time communication in `lib/websocket.ts`

## 🐛 Error Handling

The application includes comprehensive error handling:

- **API Errors:** Centralized error handling with user-friendly messages
- **WebSocket Disconnects:** Automatic reconnection with exponential backoff
- **Microphone Denial:** Graceful permission request handling
- **Session Expiration:** Automatic redirect to login
- **Network Timeouts:** User-friendly error messages

## 🔄 State Management

State is managed using React hooks:

- **Authentication:** `useAuth` hook
- **WebSocket:** `useWebSocket` hook
- **Audio Recording:** `useAudioRecorder` hook
- **Component State:** React `useState` and `useEffect`

## 📱 Responsive Design

The dashboard is designed desktop-first with responsive breakpoints:

- **Desktop:** Full grid layout with all panels visible
- **Tablet:** Adjusted grid columns
- **Mobile:** Stacked layout (future enhancement)

## 🚧 Future Enhancements

- [ ] Patient portal integration
- [ ] Mobile app support
- [ ] Offline mode
- [ ] Advanced note templates
- [ ] Voice commands
- [ ] Multi-language support

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure HIPAA compliance
4. Test thoroughly
5. Submit a pull request

## 📄 License

See `LICENSE` file for details.

## 🔗 Related Repositories

- **Backend:** [ai-med-backend](https://github.com/AI-Empower-360/ai-med-backend)
- **Agents:** [ai-med-agents](https://github.com/AI-Empower-360/ai-med-agents)
- **Infrastructure:** [ai-med-infrastructure](https://github.com/AI-Empower-360/ai-med-infrastructure)

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for healthcare professionals**
