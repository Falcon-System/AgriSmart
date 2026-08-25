# AgriSmart - AI-Powered Cassava Disease Detection

AgriSmart is a comprehensive agricultural AI application designed specifically for cassava farmers to detect and diagnose plant diseases using artificial intelligence. The platform combines computer vision technology with expert agricultural knowledge to provide real-time disease detection, treatment recommendations, and farm management tools.

## 🌱 Features Overview

- **AI-Powered Disease Scanning**: Capture or upload a plant photo to detect diseases, score severity, and get treatment recommendations
- **Interactive Dashboard**: Comprehensive farm and field management interface
- **AI Chat Assistant**: Intelligent agricultural advisor powered by Google Gemini for cassava-specific guidance
- **Farm Management**: Track and manage farms, fields, and crop health over time
- **Treatment Recommendations**: Chemical, organic, and cultural advice for detected diseases
- **Community Features**: Share experiences and learn from other farmers
- **Real-time Analysis**: Instant severity assessment and confidence scoring

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.4**: React framework for production-ready web applications
- **React 19.2.3**: JavaScript library for building user interfaces
- **TypeScript**: Strongly typed programming language that builds on JavaScript
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ShadCN UI**: Reusable components built using Radix UI and Tailwind CSS

### Backend & Database
- **MongoDB**: Local database option for app data storage and authentication records
- **Local fallback**: The app includes an in-memory local database layer so it can run without a live MongoDB instance while developing locally
- **Node.js**: JavaScript runtime environment

### AI & Machine Learning
- **AI SDK**: Framework for building AI-powered applications
- **Google Gemini Vision**: Zero-shot structured crop diagnosis (launch inference engine)
- **Local cassava classifier**: Optional FastAPI ResNet50 fallback when Gemini is unavailable

### Authentication & Security
- **JSON Web Tokens (JWT)**: Secure authentication mechanism
- **Bcrypt**: Password hashing library
- **JWS**: JSON Web Signature implementation

### Other Dependencies
- **React Webcam**: Browser-based camera access
- **TanStack Query**: Server state management
- **Lucide React**: Beautifully simple icons
- **Sonner**: Toast notifications

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (recommended package manager)
- **Git**
- **Python** (optional, only for the local cassava fallback classifier)
- **MongoDB** (recommended for persistent local data; Docker Compose is included)
- **Docker** (optional, used to start local MongoDB)

## 🔧 Local setup (MongoDB + Gemini)

Do this on your computer before we deploy.

1. Install Node.js 18+, pnpm, Git, and Docker.
2. Use the Next.js app folder (the one with `package.json` and `src/app`).
3. Checkout this branch and install:

```bash
git fetch origin
git checkout cursor/mongodb-local-run-1d19
git pull origin cursor/mongodb-local-run-1d19
pnpm install
cp .env.example .env.local
```

4. Start MongoDB and load demo data:

```bash
pnpm setup:local
```

That command starts MongoDB with Docker Compose (`docker compose up -d`), waits until it accepts connections, and seeds the demo farmer.

If Docker is not installed, install it first, or run a local MongoDB on `127.0.0.1:27017`.

5. Add your Gemini key in `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

Create the key at [Google AI Studio](https://aistudio.google.com/apikey). Keep it server-only. Do not use `NEXT_PUBLIC_` and do not commit `.env.local`.

6. Start the app:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001)

- Login: `farmer` / `FarmDemo123`
- Setup status: [http://localhost:3001/api/health](http://localhost:3001/api/health) or **Dashboard → Settings**
- Community: **Dashboard → Community**
- Chat: **Ask AI**

If you change `.env.local`, restart `pnpm dev`.

`GET /api/health` should look like this when both are ready:

```json
{ "ok": true, "mongo": { "connected": true }, "gemini": { "configured": true } }
```

### Environment variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes for persistent data |
| MONGODB_DB | Database name (defaults to `agrismart_local`) | No |
| GOOGLE_GENERATIVE_AI_API_KEY | Google AI Studio key for Gemini Vision scans and Ask AI | Yes for Gemini |
| GEMINI_API_KEY | Alias for `GOOGLE_GENERATIVE_AI_API_KEY` | No |
| JWT_SECRET | Secret for JWT cookie signing | Yes |
| NEXT_PUBLIC_BACKEND_URL | Base URL for the optional Python cassava fallback | No |
| PREDICTION_API_URL | Full predict endpoint, e.g. `http://localhost:8000/predict` | No |

Scanning uses **Gemini Vision first**. The Next.js `/api/predict` route sends the photo plus selected crop category to Gemini (`gemini-2.5-flash`, then `gemini-flash-latest`) and asks for structured JSON: crop, disease, confidence, severity grade, symptoms, and a treatment plan. That JSON is stored on the scan document in MongoDB.

If no Gemini key is set, or Gemini fails, the route falls back to the in-repo cassava ResNet classifier.

### Running the Python cassava fallback (optional)

The original trained model is no longer in GitHub. This repo includes a 5-class cassava classifier at `prediction-service/` (ResNet50, CBB / CBSD / CGM / CMD / Healthy). You only need this when Gemini is not configured.

```bash
python3 -m venv prediction-service/.venv
prediction-service/.venv/bin/pip install --upgrade pip
prediction-service/.venv/bin/pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
prediction-service/.venv/bin/pip install -r prediction-service/requirements.txt
pnpm predict:server
```

Point Next.js at it in `.env.local`:

```env
PREDICTION_API_URL="http://localhost:8000/predict"
```

## 🚀 Development Workflow

### Running the Application

1. **Start the Next.js development server:**
```bash
pnpm dev
```

2. **Access the application:**
Open your browser and navigate to `http://localhost:3001`

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3001 |
| `pnpm dev:clean` | Clear the Next.js cache and start the server (use this after changing `.env.local`) |
| `pnpm setup:local` | Start MongoDB, wait for it, and seed demo data |
| `pnpm check:env` | Check MongoDB without reseeding |
| `pnpm seed:local` | Reload demo farmers, farms, posts, and scans |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start the production server |

### Building for Production

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## 📁 Project Structure

```
cassava_frontend/
├── public/                 # Static assets and images
│   ├── cassava_image/      # Cassava disease sample images
│   ├── favicon/            # Favicon files
│   └── icons/              # App icons
├── src/
│   ├── api/                # API routes and context
│   │   └── routers/        # oRPC router definitions
│   ├── app/                # Next.js app directory (pages)
│   │   ├── api/            # API routes
│   │   │   ├── ai/         # AI chat API
│   │   │   ├── auth/       # Authentication APIs
│   │   │   ├── predict/    # Prediction API
│   │   │   └── rpc/        # RPC routes
│   │   ├── dashboard/      # Main dashboard pages
│   │   ├── login/          # Authentication pages
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Database and utility helpers (MongoDB adapter)
│   ├── tests/              # Test files
│   └── utils/              # Utility functions
├── services/               # Backend service implementations
├── .env.example            # Environment variables template
├── docker-compose.yml      # Local MongoDB
├── next.config.mjs        # Next.js configuration
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## 📖 Usage Instructions

### Disease Scanning
1. Navigate to the dashboard and click on the "Scans" section
2. Click "New Scan" and choose a crop category (`Root & Tuber`, `Solanaceous`, or `Tree Fruit`)
3. Capture a photo with the camera or upload an image
4. Wait for AI analysis to complete
5. Review disease detection, severity grade, symptoms, and the chemical / organic / cultural treatment plan

### AI Chat Functionality
1. Go to the "Chat" section in the dashboard
2. Type your question about crop health for cassava, tomato, pepper, or fruit trees
3. Receive expert advice powered by Google Gemini AI
4. From a scan report, click "Ask AI for More Details". Chat loads that scan from MongoDB and sends crop, disease, severity, symptoms, and treatment to Gemini as system context.

## 🌐 API Documentation

### Prediction API
**Endpoint**: `POST /api/predict`
- **Description**: Analyze an uploaded plant image with Gemini Vision structured output, falling back to the local cassava classifier
- **Request Body**:
  ```json
  {
    "image": "base64-encoded-image-string",
    "cropCategory": "Root & Tuber"
  }
  ```
- **Response** (Gemini path): crop category, detected crop, disease, confidence, severity grade, symptoms, and a treatment plan with `chemical_control`, `organic_biological`, and `cultural_practices`

### AI Chat API
**Endpoint**: `POST /api/ai`
- **Description**: Stream a Gemini agronomist reply. If `scanId` is sent, the route loads that scan from MongoDB and injects crop, disease, severity, symptoms, and treatment as system context.
- **Request Body**:
  ```json
  {
    "messages": [],
    "scanId": "uuid-of-scan"
  }
  ```

### Authentication APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  

## 🚀 Deployment Guide

Try the app locally first. When Mongo and Gemini both show ready in `/api/health`, we can deploy to the server.

On the server you will set the same secrets, with a production Mongo URI and a strong `JWT_SECRET`:

```env
MONGODB_URI="mongodb+srv://USER:PASSWORD@HOST/agrismart"
MONGODB_DB="agrismart"
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
JWT_SECRET="a-long-random-secret"
```

Do not copy `.env.local` into git. Set these values in the server environment or process manager.

### Vercel (optional)

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Set the environment variables above in the Vercel dashboard
4. Deploy

## 🤝 Contributing

We welcome contributions to improve AgriSmart!

## 📄 License

This project is licensed under the MIT License.

## 🛠️ Troubleshooting

### Common Issues

#### 1. Camera Access Errors
- **Issue**: "Unable to access camera"
- **Solution**: Ensure you're using HTTPS (localhost is allowed) and camera permissions are granted

#### 2. MongoDB Connection Errors
- **Issue**: Data disappears after restart, or logs show "MongoDB connection failed"
- **Solution**: Run `pnpm setup:local` (or `docker compose up -d`) and confirm `MONGODB_URI` is set in `.env.local`. Check [http://localhost:3001/api/health](http://localhost:3001/api/health).

#### 3. Gemini or prediction unavailable
- **Issue**: Ask AI says it is unavailable, or scans skip Gemini
- **Solution**: Put a real Google AI Studio key in `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`, then stop `pnpm dev` and start it again. Placeholder text such as `your-google-api-key-here` is ignored. The Python fallback is optional: `pnpm predict:server`.

#### 4. "Module factory is not available" after inserting the Gemini key
- **Issue**: Next.js shows a Runtime Error about `boundary-components.js` or `module factory is not available` right after you save `.env.local`
- **Solution**: This is a hot-reload crash, not a bad API key. Stop the server with Ctrl+C, then run `pnpm dev:clean` and hard-refresh the browser.

---

## About AgriSmart

AgriSmart aims to revolutionize cassava farming by providing smallholder farmers with access to advanced AI technology for early disease detection. By enabling prompt identification and treatment of cassava diseases, we hope to reduce crop losses and improve food security in cassava-growing regions.

Made with ❤️ for cassava farmers worldwide.
