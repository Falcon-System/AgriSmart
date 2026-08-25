# AgriSmart - AI-Powered Cassava Disease Detection

AgriSmart is a comprehensive agricultural AI application designed specifically for cassava farmers to detect and diagnose plant diseases using artificial intelligence. The platform combines computer vision technology with expert agricultural knowledge to provide real-time disease detection, treatment recommendations, and farm management tools.

## 🌱 Features Overview

- **AI-Powered Disease Scanning**: Capture images of cassava leaves to instantly detect diseases using advanced machine learning models
- **Interactive Dashboard**: Comprehensive farm and field management interface
- **AI Chat Assistant**: Intelligent agricultural advisor powered by Google Gemini for cassava-specific guidance
- **Farm Management**: Track and manage farms, fields, and crop health over time
- **Treatment Recommendations**: Detailed treatment and prevention advice for detected diseases
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
- **Google Gemini**: Advanced AI model for agricultural insights
- **Custom ML Model**: Specialized cassava disease detection model

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
- **Python** (for the backend prediction server)
- **MongoDB** (recommended for persistent local data; Docker Compose is included)
- **Docker** (optional, used to start local MongoDB)

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cassava_frontend
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
MONGODB_URI="mongodb://127.0.0.1:27017"
MONGODB_DB="agrismart_local"
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key-here"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

5. Start local MongoDB (recommended):
```bash
docker compose up -d
```

If `MONGODB_URI` is not set or MongoDB is unreachable, the app falls back to an in-memory store. That fallback is not persistent across restarts.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string for persistent local storage | Recommended |
| MONGODB_DB | MongoDB database name to use (defaults to `agrismart_local`) | No |
| GOOGLE_GENERATIVE_AI_API_KEY | Google AI API key for Gemini integration | Yes |
| JWT_SECRET | Secret for JWT token signing | Yes |
| NEXT_PUBLIC_BACKEND_URL | URL for the Python prediction backend | Yes |

### Running the Python Backend

The AI prediction functionality requires a separate Python backend server:

1. Navigate to your Python backend directory
2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Python server:
```bash
python -m uvicorn main:app --reload --port 8000
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
2. Click "New Scan" to open the camera interface
3. Position a cassava leaf within the frame
4. Take a photo of the leaf
5. Wait for AI analysis to complete
6. Review disease detection results, severity, and treatment recommendations

### AI Chat Functionality
1. Go to the "Chat" section in the dashboard
2. Type your question about cassava farming or disease management
3. Receive expert advice powered by Google Gemini AI
4. The AI is specifically trained on cassava-related topics

## 🌐 API Documentation

### Prediction API
**Endpoint**: `POST /api/predict`
- **Description**: Analyze uploaded cassava leaf image for disease detection
- **Request Body**: 
  ```json
  {
    "image": "base64-encoded-image-string"
  }
  ```

### AI Chat API
**Endpoint**: `POST /api/ai`
- **Description**: Communicate with the AI agricultural assistant

### Authentication APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  

## 🚀 Deployment Guide

### Vercel (Recommended)
1. Push your code to a Git repository
2. Import your project in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on pushes to main branch

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
- **Solution**: Start MongoDB with `docker compose up -d` and confirm `MONGODB_URI` is set in `.env.local`

#### 3. Prediction Service Unavailable
- **Issue**: "Prediction service is currently unavailable"
- **Solution**: Ensure your Python backend server is running on `http://localhost:8000`

---

## About AgriSmart

AgriSmart aims to revolutionize cassava farming by providing smallholder farmers with access to advanced AI technology for early disease detection. By enabling prompt identification and treatment of cassava diseases, we hope to reduce crop losses and improve food security in cassava-growing regions.

Made with ❤️ for cassava farmers worldwide.
