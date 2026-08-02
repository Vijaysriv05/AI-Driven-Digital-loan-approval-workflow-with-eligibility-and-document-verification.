import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import applicationsRoutes from './routes/applications.js';
import documentsRoutes from './routes/documents.js';
import eligibilityRoutes from './routes/eligibility.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Nimbus Lending API Running with RBAC Security',
    version: '2.0.0',
    status: 'Success',
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/reports', reportsRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nimbus Lending RBAC API running on port ${PORT}`);
});