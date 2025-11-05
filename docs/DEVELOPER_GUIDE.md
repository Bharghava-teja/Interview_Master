# Developer Guide – Interview Master

## 1. Project Overview

- Name: Interview Master
- Version: Server `1.0.0`, Client `0.1.0`
- Description: Interview Master is a full-stack platform for mock interviews, resume analysis, and skill-based assessments. It supports secure real-time video calls, encrypted messaging, automated question generation, MCQ generation, sentiment analysis, and actionable feedback powered by local NLP models bridged from Node.js.
- Problem Solved:
  - Practice interviews with security monitoring and secure communication.
  - Automated question and MCQ generation tailored to resume-extracted skills.
  - Resume parsing with improvement suggestions and analytics.
  - Integrated scoring, feedback, and recommendations for structured preparation.
- Target Users: Job candidates, students, career centers, and training institutions seeking structured interview practice and skill evaluations.
- Tech Stack Summary:
  - Frontend: React (CRA), Redux Toolkit, Tailwind CSS, FaceAPI, WebRTC
  - Backend: Node.js, Express 5, Mongoose, JWT auth, WebSocket signaling
  - Database: MongoDB (Mongoose schemas)
  - Caching/Session: Redis (optional fallback to memory)
  - NLP: Python scripts via a bridge (Transformers and local models)
  - Deployment: Vercel (frontend), Render (backend), local dev support

## 2. System Architecture

```mermaid
flowchart TD
  U[User] --> F[Frontend (React)]
  F -->|REST| B[Backend (Express)]
  F -->|WebSocket| WS[Signaling Server /ws]
  B --> DB[(MongoDB)]
  B --> R[(Redis)]
  B --> PY[Python Bridge (NLP)]
  PY --> HF[(Local Model Cache)]
```

- Subsystems:
  - Backend (Express):
    - REST API for auth, resumes, interviews, NLP, exams, and violations.
    - WebSocket signaling server (`/ws`) for WebRTC negotiation and chat fallback.
    - Mongoose for data models; Redis for sessions/cache (optional).
    - Monitoring/logging via Winston with rotating files; performance tracking.
  - Frontend (React):
    - SPA with routing; components for secure video calls, resume upload/analysis, exams.
    - Uses WebRTC for P2P media; encrypted data channels for secure messaging.
    - Signaling fallback via WebSocket for chat before data channel opens.
    - State managed with Redux Toolkit and local persistence.
  - Database:
    - MongoDB with Mongoose schemas for `User`, `Resume`, `InterviewSession`, `Exam`, `Result`, `SecurityViolation`.
  - Python NLP:
    - Local scripts invoked via a Node bridge for question generation, MCQs, ASR, sentiment, recommendations, and security image analysis.

- Component Interaction:
  - Request-Response Flow:
    - `User → Frontend → REST API (Express) → MongoDB`
    - WebRTC: `Frontend ↔ Signaling Server (/ws) ↔ Peer Connections`
    - NLP: `Backend → PythonBridge → Scripts → Backend → Frontend`

- External Services:
  - Optional cloud deployment via Render (backend) and Vercel (frontend).
  - STUN servers for WebRTC; TURN to be added for production-grade NAT traversal.

## 3. Technology Stack & Dependencies

| Technology | Purpose | Version |
|---|---|---|
| Node.js | Backend runtime | >=16 |
| Express | Web framework | 5.1.0 |
| Mongoose | ODM for MongoDB | 8.17.0 |
| ws | WebSocket signaling server | 8.18.3 |
| Redis | Sessions/caching (optional) | 5.x |
| JWT | Authentication | 9.0.2 |
| Joi | Validation schemas | 17.9.2 |
| Helmet | Security headers | 7.2.0 |
| express-rate-limit | Rate limiting | 7.5.1 |
| express-mongo-sanitize | Sanitize Mongo queries | 2.2.0 |
| Winston + daily rotate | Logging | 3.17.0 / 4.7.1 |
| React | Frontend SPA | 19.1.1 |
| Redux Toolkit | State management | 2.9.2 |
| Tailwind CSS | Styling | 3.4.17 |
| face-api.js | Client-side face detection | 0.22.2 |
| WebRTC | Real-time media + secure data channels | N/A |
| Axios | HTTP client | 1.11.0 |
| Python Transformers | NLP models (local) | varies |
| Render | Backend deployment | N/A |
| Vercel | Frontend hosting | N/A |

- Rationale:
  - Express + Mongoose for robust, maintainable backend with schema-driven validation.
  - ws for lightweight signaling; WebRTC for secure, low-latency media/data.
  - Redis to improve session/caching performance and scalability.
  - Tailwind + React for rapid, consistent UI development.
  - Local NLP via Python for cost control and offline capability.

## 4. Project Structure

```
interview-master/
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   │   └── SecureVideoCall.jsx
│   │   ├── services/
│   │   │   ├── WebRTCService.js
│   │   │   ├── SignalingService.js
│   │   │   └── SecurityService.js
│   │   ├── contexts/
│   │   │   └── ExamContext.jsx
│   │   ├── store/
│   │   │   └── index.js
│   │   └── serviceWorkerRegistration.ts
│   └── public/ ...
├── server/
│   ├── package.json
│   ├── index.js                # Express app and WebSocket signaling
│   ├── routes/
│   │   ├── auth.js
│   │   ├── resume.js
│   │   ├── interview.js
│   │   └── nlp.js
│   ├── controllers/
│   │   └── nlpController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Resume.js
│   │   ├── InterviewSession.js
│   │   ├── Exam.js
│   │   ├── Result.js
│   │   └── SecurityViolation.js
│   ├── services/
│   │   └── monitoringService.js
│   ├── utils/
│   │   ├── responseFormatter.js
│   │   ├── performance.js
│   │   └── pythonBridge.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── security.js
│   ├── python/
│   │   ├── mcq_generator.py
│   │   ├── question_generator.py
│   │   └── sentiment_analysis.py
│   ├── uploads/
│   └── tests/ ...
├── render.yaml                 # Render deployment config
└── README.md
```

- Key files:
  - `server/index.js`: App setup, middleware, REST routes, WebSocket signaling.
  - `client/src/components/SecureVideoCall.jsx`: UI and logic for secure calls and chat.
  - `client/src/services/WebRTCService.js`: Peer connection and data channel management.
  - `client/src/services/SignalingService.js`: WebSocket client for signaling and chat fallback.
  - `server/controllers/nlpController.js`: NLP endpoints invoking Python scripts.

## 5. Data Models / Database Schema

- Model: User
  - Fields: `name (String)`, `email (String, unique)`, `password (String hashed)`, `role (String)`, `isActive (Boolean)`, `createdAt/updatedAt (Date)`.
  - Relationships: `User` has many `Resume`, `InterviewSession`, `Exam`, `Result`.

- Model: Resume
  - Fields: `resumeId (String)`, `userId (ObjectId)`, `fileInfo (Object)`, `extractedText (String)`, `parsedData (Object skills/sections)`, `evaluation (Object)`, `feedback (Array)`, `createdAt (Date)`.
  - Methods: `findByUserId(userId)`, `getAnalytics(userId)`.

- Model: InterviewSession
  - Fields: `sessionId (String)`, `userId (ObjectId)`, `status (String)`, `startTime/endTime (Date)`, `notes (String)`, `metrics (Object)`.

- Model: Exam
  - Fields: `examId (String)`, `userId (ObjectId)`, `examType (String)`, `title (String)`, `status (String)`, `totalTimeLimit (Number)`, `configuration (Object)`.

- Model: Result
  - Fields: `userId (ObjectId)`, `examId (String)`, `scores (Array/Object)`, `summary (String)`, `createdAt (Date)`.

- Model: SecurityViolation
  - Fields: `examId (String)`, `type (String)`, `severity (String)`, `details (Object)`, `timestamp (Date)`.

- Notes:
  - All IDs are strings except `_id` (`ObjectId`).
  - Soft relations via id fields; Mongoose used for validation and indexes.

## 6. Detailed Function & Class Documentation

### SignalingService (client/src/services/SignalingService.js)

- Description: Manages WebSocket signaling and chat fallback.
- Methods:
  - `connect(sessionId, isHost, participantName, url?)`: Opens WebSocket and sends `join` with role. Resolves `true` on success.
  - `sendOffer(sessionId, offer)`, `sendAnswer(sessionId, answer)`, `sendIce(sessionId, candidate)`, `sendChat(sessionId, author, content, timestamp)`: Send respective payloads if socket is open.
  - `leave()`: Send `leave` and close socket.
- Events: `onReady`, `onWaiting`, `onOffer`, `onAnswer`, `onIce`, `onPeerLeft`, `onChat`.

### WebRTCService (client/src/services/WebRTCService.js)

- Description: Manages `RTCPeerConnection`, tracks, and `RTCDataChannel` for secure messaging.
- Methods:
  - `initializeSession(sessionId, isHost?)`: Create `RTCPeerConnection`, attach handlers, create data channel if host.
  - `setupPeerConnectionHandlers(peerConnection, sessionId)`: ICE, track, datachannel, connection state changes.
  - `setupDataChannelHandlers(dataChannel, sessionId)`: `onopen`, `onmessage` decrypts payloads if enabled, `onerror`.
  - Offer/Answer:
    - `createOffer(sessionId)`: Create/set local description, return SDP.
    - `createAnswer(sessionId, offer)`: Set remote, create/set local, return SDP.
    - `setRemoteDescription(sessionId, answer)`, `addIceCandidate(sessionId, candidate)`: Apply remote info.
  - Streams: `getUserMedia`, `startScreenShare`, `stopScreenShare`.

### NLP Controller (server/controllers/nlpController.js)

- `generateQuestions`
  - Params: `skills[]`, `role`, `experience`, `resumeText?`, `previousQuestions[]?`, `examId?`, `resumeId?`, `triggers[]?`.
  - Logic: Checks `NLP_ENABLED`. Hydrates `resumeText` and merges skills from `Resume` if `resumeId` provided. Invokes Python `question_generator.py`.

- `generateMcqs`
  - Params: `skills[]` (required), `role`, `domain`, `count`, `maxPerSkill`, `dimensions`, `difficultyDistribution`.
  - Logic: Invokes `mcq_generator.py` with model from env; logs via monitoring service.

- `transcribeAudio`
  - Params: Multipart field `audio`. Uses `multer` to store audio, then calls `nlp_asr.py`.

- `evaluateAnswer`, `generateFeedback`, `detectSecurity`, `recommendPractice`, `analyzeSentiment`: Bridge respective Python scripts.

### Auth Middleware (server/middleware/auth.js)

- Optional Redis-backed session store with in-memory fallback.
- JWT sign/verify; blacklist handling in Redis.
- Methods: `authenticate`, `optionalAuth`, `clearAllSessions`.

### Utilities

- `APIResponse.success(data, message)`: Consistent success response wrapper.
- `AppError(message, status)`: Standardized error wrapper.

## 7. Algorithms / Logic Flow

### WebRTC Negotiation Flow

```text
Host:
  init session
  connect signaling; on ready -> createOffer -> sendOffer
Participant:
  connect signaling; on offer -> createAnswer -> sendAnswer
Both:
  on ice -> sendIce; on answer (host) -> setRemote; on ice -> addIce
on datachannel open -> switch chat to secure channel; fallback via signaling until open
```

### Chat Fallback Logic

```text
if dataChannel.readyState === 'open':
  send via data channel (encrypted if enabled)
else if signaling socket ready:
  send via signaling (ws)
else:
  mark queued until either path opens
```

### Resume Analysis Pipeline

```text
Upload -> Extract text (PDF/Doc) -> Parse sections -> Evaluate (scores)
-> Generate feedback (action items) -> Persist in Resume model
```

## 8. API Documentation

- Base URL:
  - Development: `http://localhost:5000`
  - Render: `https://interview-backend.onrender.com/api/v1`

### Auth

- `POST /api/auth/signup` (Public)
  - Body: `{ name, email, password }`
  - Response: `{ success, userId }`

- `POST /api/auth/login` (Public)
  - Body: `{ email, password }`
  - Response: `{ token, refreshToken, user }`

### Resumes

- `POST /api/v1/resumes/upload` (Protected, multipart)
  - Form fields: `file`, optional flags
  - Response: `{ resumeId, parsedData, evaluation, feedback }`

- `POST /api/v1/resumes/:resumeId/reanalyze` (Protected)
  - Params: `resumeId`
  - Response: Updated analysis object

### Interviews / Signaling

- WebSocket: `ws://localhost:5000/ws`
  - Message types:
    - `join { sessionId, role, name }`
    - `ready`, `waiting`, `offer { sdp }`, `answer { sdp }`, `ice { candidate }`, `peer_left`, `chat_message { author, content, timestamp }`

### NLP (`/nlp`)

- `POST /nlp/generate-questions` (Optional auth)
  - Body: `{ skills?, role?, experience?, resumeText?, previousQuestions?, examId?, triggers? }`
  - Response: `{ questions: [...] }`

- `POST /nlp/generate-mcqs` (Optional auth)
  - Body: `{ skills: [...], role?, domain?, count?, maxPerSkill? }`
  - Response: `{ count, items: [ { question, options, correct_id } ] }`

- `POST /nlp/evaluate-answer` (Protected)
  - Body: `{ candidateAnswer, modelAnswer }`

- `POST /nlp/generate-feedback` (Protected)
  - Body: `{ answer, missingConcepts }`

- `POST /nlp/transcribe` (Protected, multipart)
  - Form: `audio`

- `POST /nlp/security-detect` (Protected)
  - Body: `{ imageBase64 }`

- `POST /nlp/recommend` (Protected)
  - Body: `{ scores }`

- `POST /nlp/analyze-sentiment` (Protected)
  - Body: `{ text|answer|candidateAnswer }`

#### Example Request

```bash
curl -X POST http://localhost:5000/nlp/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"skills":["react","node"],"role":"frontend","experience":"junior"}'
```

## 9. Frontend / UI Documentation

- Components:
  - `SecureVideoCall.jsx`: Video call UI, connection status, alerts, chat banner indicating signaling fallback vs queued messages, secure chat rendering.
  - `ExamContext.jsx`: Exam lifecycle state, violation reporting to server, timers, progress.

- Navigation Flow:
  - Login → Dashboard → Resume Upload/Analysis → Mock Interview → Exam/MCQ

- Backend Interaction:
  - Uses Axios and `fetch` to hit REST endpoints; uses WebSocket for signaling and chat fallback; peer-to-peer for media and secure data once connected.

- State Management:
  - Redux slices `resumeSlice`, `assessmentSlice` with localStorage persistence.

## 10. Configuration & Environment Setup

- Prerequisites:
  - Node.js >= 16, npm >= 8
  - MongoDB local or cloud
  - Python 3.9+ for NLP features

- Server `.env` sample:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/interview-master
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret
SESSION_SECRET=your-session-secret
REDIS_URL=redis://localhost:6379
NLP_ENABLED=true
NLP_MODEL_QG=google/flan-t5-small
NLP_MODEL_SUMMARY=google/flan-t5-base
NLP_MODEL_MCQ=google/flan-t5-base
NLP_EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
APP_VERSION=1.0.0
```

- Client `.env` sample:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SIGNALING_URL=ws://localhost:5000/ws
REACT_APP_ENVIRONMENT=development
```

- Install & Run:

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm start
```

## 11. Testing & Validation

- Backend: Jest + Supertest
  - Commands: `npm run test`, `test:unit`, `test:integration`

```js
// server/tests/auth.test.js
const request = require('supertest');
const app = require('../index');
test('signup then login', async () => {
  await request(app).post('/api/auth/signup').send({name:'A',email:'a@b.com',password:'x'});
  const res = await request(app).post('/api/auth/login').send({email:'a@b.com',password:'x'});
  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeDefined();
});
```

- Frontend: React Testing Library
  - Commands: `npm test`

```tsx
// client/src/components/__tests__/SecureVideoCall.test.tsx
import { render } from '@testing-library/react';
import SecureVideoCall from '../SecureVideoCall';
test('renders chat banner initially', () => {
  const { getByText } = render(<SecureVideoCall />);
  expect(getByText(/Using signaling fallback/)).toBeTruthy();
});
```

## 12. Error Handling & Logging

- Strategy:
  - Centralized `AppError` and `globalErrorHandler` in Express.
  - `APIResponse` wrapper for consistent success/error JSON.
  - Monitoring service logs performance, security, and errors via Winston with daily rotate files.

- Logging:
  - Request logging middleware; performance tracking (slow request warnings).
  - Logs stored in rotating files: `error-%DATE%.log`, `security-%DATE%.log`, `performance-%DATE%.log`.

## 13. Deployment Guide

- Local:
  - Ensure MongoDB is running; set `.env`; start server and client as above.

- Render (Backend):
  - `render.yaml` provided; uses environment-backed `MONGO_URI` and `REDIS_URL`.
  - Build: `cd server && npm ci`; Start: `cd server && npm start`.

- Vercel (Frontend):
  - Build `client` and publish `build` directory.
  - Configure `REACT_APP_API_URL` to Render backend URL.

- CI/CD:
  - Recommend GitHub Actions for tests and lint; not bundled by default.

- Scaling & Backup:
  - Scale backend dynos and Redis; configure Mongo Atlas backups; add TURN servers for WebRTC.

## 14. Security Considerations

- Implemented:
  - JWT-based authentication; sessions backed by Redis if available.
  - Helmet security headers; rate limiting; request body size limits.
  - `express-mongo-sanitize` and Mongoose strict query and filter sanitization.
  - Input validation via Joi schemas for critical routes.
  - XSS and DOMPurify on client-side as needed.
  - SecurityViolation model and client-side security monitoring.

- Future:
  - Enforce fingerprinting (`requireFingerprint: true`).
  - Add TURN servers for robust P2P connectivity.
  - Periodic token rotation and shorter token lifetimes.
  - CSP strict mode and SRI for static assets.

## 15. Performance and Optimization

- Current:
  - `compression` middleware on backend.
  - Optional Redis for caching and sessions.
  - Performance monitoring of request latency, CPU/memory trends.
  - Frontend code-splitting via CRA defaults; service worker optionally for PWA.

- Recommended:
  - Introduce server-side caching for heavy endpoints (e.g., resume analysis).
  - Warm caches for NLP model metadata.
  - Optimize MongoDB indexes on frequently queried fields.

## 16. Limitations & Future Scope

- Limitations:
  - No TURN servers included; NAT traversal may fail for some P2P scenarios.
  - NLP depends on local model availability; initial cold-start downloads required.
  - WebRTC data channel must open for fully secure messaging; signaling fallback used prior.

- Future Scope:
  - Add TURN server configuration (e.g., coturn).
  - Expand analytics dashboards for resumes and sessions.
  - Add multi-participant rooms and moderators.
  - Enhance MCQ bank and tagging; adaptive testing.

## 17. Contribution Guidelines

- Branching: `feature/<short-name>`, `fix/<issue-id>`.
- Commits: Conventional commits (`feat:`, `fix:`, `docs:`).
- Process:
  - Open an issue or draft PR.
  - Include tests for backend changes; run `npm run test`.
  - Ensure lint passes: `npm run lint`.
  - Provide screenshots for UI changes and update docs when adding features.

## 18. References and Acknowledgments

- Libraries/APIs:
  - Express, Mongoose, ws, Redis, Winston, Helmet, Joi.
  - React, Redux Toolkit, Tailwind CSS, face-api.js, WebRTC.
  - Transformers, sentence-transformers for Python NLP.

- Deployment:
  - Render for backend; Vercel for frontend.

- Credits:
  - Thanks to open-source maintainers of the above ecosystems.

## 19. Appendix (Optional)

- Version History:
  - v1.0.0 (Server): Initial production-ready backend with REST, signaling, models.
  - v0.1.0 (Client): Initial SPA with secure call component and resume/exam modules.

- Secrets & Tokens:
  - Never commit secrets. Use environment variables and managed secrets in deployment providers.
  - Required keys: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`.

- Additional Diagrams:

```mermaid
sequenceDiagram
  participant Host
  participant Server
  participant Participant
  Host->>Server: ws join {sessionId, role=host}
  Participant->>Server: ws join {sessionId, role=participant}
  Server-->>Host: ready
  Server-->>Participant: ready
  Host->>Server: offer {sdp}
  Server-->>Participant: offer {sdp}
  Participant->>Server: answer {sdp}
  Server-->>Host: answer {sdp}
  Host->>Server: ice candidates
  Participant->>Server: ice candidates
  Server-->>Both: ice candidates
  Note over Host,Participant: Data channel opens; chat switches from signaling to secure channel
```

- Logs:
  - Check backend console for startup info:
    - “Server running on port 5000”
    - “WebSocket signaling server ready at ws://localhost:5000/ws”
    - MongoDB and Redis health logs
  - File logs in rotating directories (see monitoring service).