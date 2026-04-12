require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { supabase } = require('./config/supabase');
const auditMiddleware = require('./middleware/audit');

const app = express();

// --------------- Middleware Stack ---------------

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for Bootstrap
}));

// CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditMiddleware);

// Serve static files from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// --------------- Health Check ---------------

app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// --------------- Routes ---------------

const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const allergyRoutes = require('./routes/allergyRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const administrationRoutes = require('./routes/administrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const noteRoutes = require('./routes/noteRoutes');
const auditRoutes = require('./routes/auditRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', administrationRoutes);
app.use('/api', allergyRoutes); // Handles /api/patients/:patientId/allergies and /api/allergies/:id
// Nested routes MUST come before /api/patients to avoid route conflicts
app.use('/api/patients/:pid/schedules', scheduleRoutes);
app.use('/api/patients/:pid/notes', noteRoutes);
// Main patient routes (must come AFTER nested routes)
app.use('/api/patients', patientRoutes);

// --------------- Fallback: Serve index.html for non-API routes ---------------

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --------------- Start Server ---------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
