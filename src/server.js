require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { supabase } = require('./config/supabase');

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

app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
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
