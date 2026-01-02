import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDatabase } from './lib/prisma.js';
import { errorHandler } from './middleware/common/errorHandler.js';
import { authRoutes } from './routes/auth/auth.routes.js';
import { campaignRoutes } from './routes/campaign/campaign.routes.js';
import { applicationRoutes } from './routes/application/application.routes.js';
import { reviewRoutes } from './routes/review/review.routes.js';
import { messageRoutes } from './routes/message/message.routes.js';
import { creatorRoutes } from './routes/creator/creator.routes.js';
import { venueRoutes } from './routes/venue/venue.routes.js';

const app = express();

// Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/venues', venueRoutes);

app.use(errorHandler());

async function startServer() {
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.warn(`🚀 Server running on http://localhost:${config.port}`);
    console.warn(`📍 Environment: ${config.nodeEnv}`);
  });
}

startServer();

