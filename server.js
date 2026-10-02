require('dotenv').config(); // Top of server.js

// Global JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'issai_dental_clinic_secret_key_2026';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thyagu1798_db_user:XqNH8TEse34ZUCfo@cluster0.gssz0tz.mongodb.net/issai_dental_db?retryWrites=true&w=majority&appName=Cluster0';

/* ==========================================================================
   MIDDLEWARE & STATIC ASSETS CONFIGURATION
   ========================================================================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Authentication Middleware Definition
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Serve static assets from root and explicit subdirectories for CSS, JS, Images, Fonts
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));

/* ==========================================================================
   DATABASE CONNECTION & CONFIGURATION
   ========================================================================== */
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

/* ==========================================================================
   MONGOOSE SCHEMAS & MODELS
   ========================================================================== */

// Flexible User Schema mapped to custom DB fields
const userSchema = new mongoose.Schema({
  loginId: { type: String },
  emailid: { type: String },
  email: { type: String },
  username: { type: String },
  name: { type: String },
  password: { type: String, required: true },
  userRole: { type: String },
  role: { type: String },
  logintype: { type: String },
  allowedPortal: { type: String },
  department: { type: String },
  docname: { type: String },
}, { timestamps: true, strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema, 'LoginPasswords');

// Counter Schema to track sequential patient numbers
const counterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema, 'counters');

// Schema for Clinical Visit History (Embedded inside Patient)
const clinicalVisitSchema = new mongoose.Schema({
  patientCustomId: String,
  doctorId: String,
  doctorName: String,
  visitDate: String,
  primaryComplaint: String,
  chiefComplaints: String,
  medicalHistory: Object,
  habits: Object,
  extraOral: Object,
  intraOral: Object,
  examNotes: String,
  investigationText: String,
  docAdvisedPlan: String,
  patientAcceptedPlan: String,
  estimatedFees: Array,
  totalEstimatedCost: Number,
  prescription: Array,
  nextVisit: String,
  patientConsent: Boolean,
  status: { type: String, default: 'Completed' }
});

// Schema for Clinical Records (Patients Collection)
const patientSchema = new mongoose.Schema({
  patientCustomId: { type: String, unique: true, sparse: true },
  patientId: { type: String },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  mobile: { type: String },
  gender: { type: String, default: 'Not Specified' },
  bloodGroup: { type: String, default: 'N/A' },
  dob: { type: String, default: '' },
  age: { type: String, default: '' },
  visitDate: { type: String },
  queueNo: { type: Number },
  serviceHistory: [clinicalVisitSchema],
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] } // YYYY-MM-DD
}, { timestamps: true });

const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema, 'clinicalrecords');

// Schema for Appointments
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String, required: true },
  phone: { type: String, required: true },
  doctorId: { type: String },
  doctor: { type: String, default: 'Unassigned' },
  doctorName: { type: String },
  department: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, default: 'Unscheduled' },
  symptoms: { type: String, default: '' },
  status: { type: String, default: 'Waiting' },
  doctorFee: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Pending' },
  remainingBalance: { type: Number, default: 0 },
  paymentMode: { type: String, default: '-' },
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema, 'appointments');

/* ==========================================================================
   NODEMAILER TRANSPORTER SETUP
   ========================================================================== */
const transporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

/* ==========================================================================
   HELPER & AUTHENTICATION FUNCTIONS
   ========================================================================== */

function normaliseRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'admin') return 'reception';
  return r;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findUserByCredentials(loginId, password, role) {
  const cleanLogin = loginId.trim();
  const cleanPassword = password.trim();
  const cleanRole = normaliseRole(role);

  const user = await User.findOne({
    $or: [
      { username: { $regex: `^${escapeRegex(cleanLogin)}$`, $options: 'i' } },
      { loginId: { $regex: `^${escapeRegex(cleanLogin)}$`, $options: 'i' } },
      { emailid: { $regex: `^${escapeRegex(cleanLogin)}$`, $options: 'i' } },
      { email: { $regex: `^${escapeRegex(cleanLogin)}$`, $options: 'i' } }
    ]
  });

  if (!user) return null;

  const dbPassword = (user.password || '').toString().trim();
  let isValidPassword = false;

  if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
    isValidPassword = await bcrypt.compare(cleanPassword, dbPassword);
  } else {
    isValidPassword = (cleanPassword === dbPassword);
  }

  if (!isValidPassword) return null;

  const userRole = (user.role || user.logintype || user.allowedPortal || '').toString().toLowerCase();
  if (userRole && !userRole.includes(cleanRole) && !cleanRole.includes(userRole)) {
    console.warn(`[Auth Warning] Password matched for ${cleanLogin}, but role mismatch (DB: '${userRole}', Input: '${cleanRole}')`);
  }

  return user;
}

// Universal Login Handler
const handleLoginRequest = async (req, res) => {
  try {
    const loginInput = req.body.email || req.body.loginId || req.body.username;
    const passwordInput = req.body.password;

    if (!loginInput || !passwordInput) {
      return res.status(400).json({ success: false, error: 'Please provide credentials.' });
    }

    const cleanInput = String(loginInput).trim();
    const cleanPassword = String(passwordInput).trim();

    const user = await User.findOne({
      $or: [
        { loginId: { $regex: `^${escapeRegex(cleanInput)}$`, $options: 'i' } },
        { emailid: { $regex: `^${escapeRegex(cleanInput)}$`, $options: 'i' } },
        { email: { $regex: `^${escapeRegex(cleanInput)}$`, $options: 'i' } },
        { username: { $regex: `^${escapeRegex(cleanInput)}$`, $options: 'i' } }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Login ID or Password' });
    }

    const dbPassword = (user.password || '').trim();
    let isValid = dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')
      ? await bcrypt.compare(cleanPassword, dbPassword)
      : (cleanPassword === dbPassword);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid Login ID or Password' });
    }

    const rawRole = (user.logintype || user.role || user.userRole || user.allowedPortal || '').toLowerCase().trim();

    let redirectUrl = 'admin-dashboard.html';
    if (rawRole === 'chief_doctor' || rawRole === 'chiefdoctor') {
      redirectUrl = 'chiefdoctor-dashboard.html';
    } else if (rawRole === 'doctor') {
      redirectUrl = 'doctor-admin.html';
    } else if (rawRole === 'reception' || rawRole === 'admin') {
      redirectUrl = 'admin-dashboard.html';
    }

    const doctorDisplayName = user.docname || user.name || user.username || user.loginId;

    const token = jwt.sign(
      { id: user._id, name: doctorDisplayName, doctorName: doctorDisplayName, role: rawRole },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      redirect: redirectUrl,
      redirectUrl: redirectUrl,
      doctorName: doctorDisplayName,
      user: {
        id: user._id,
        name: doctorDisplayName,
        role: rawRole,
        department: user.department || 'General Dentistry'
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

// Helper to extract authenticated user from Token / Session
async function getAuthUserFromRequest(req) {
  let userId = req.session?.userId;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null' && token.split('.').length === 3) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token expired or invalid
      }
    }
  }

  if (userId) {
    return await User.findById(userId);
  }
  return null;
}

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

// Bind login handler to both endpoints
app.post('/api/login', handleLoginRequest);
app.post('/api/auth/login', handleLoginRequest);

// Doctor Profile Endpoint
app.get('/api/doctor/profile', async (req, res) => {
  try {
    const dbUser = await getAuthUserFromRequest(req);
    if (dbUser) {
      return res.json({ 
        success: true, 
        name: dbUser.docname || dbUser.name || dbUser.username || dbUser.loginId,
        doctorName: dbUser.docname || dbUser.name || dbUser.username || dbUser.loginId
      });
    }
    res.status(401).json({ success: false, message: "Doctor profile not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
});

// GET Current Logged-In User Profile (/api/current-user)
app.get('/api/current-user', async (req, res) => {
  try {
    const dbUser = await getAuthUserFromRequest(req);

    if (dbUser) {
      const rawRole = (dbUser.role || dbUser.logintype || dbUser.userRole || '').toLowerCase().trim();

      return res.json({
        success: true,
        user: {
          id: dbUser._id,
          name: dbUser.docname || dbUser.name || dbUser.username || dbUser.loginId,
          loginId: dbUser.loginId || dbUser.username,
          role: rawRole,
          isAdmin: rawRole === 'admin' || rawRole === 'reception' || rawRole === 'chief_doctor',
          department: dbUser.department || 'General Dentistry'
        }
      });
    }

    res.json({
      success: true,
      user: {
        name: "Doctor Admin",
        role: "admin",
        department: "General Dentistry"
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Session Auth Inspection Endpoint (/api/auth/me)
app.get('/api/auth/me', async (req, res) => {
  try {
    const dbUser = await getAuthUserFromRequest(req);
    
    if (dbUser) {
      return res.json({
        id: dbUser._id,
        doctorName: dbUser.docname || dbUser.name || dbUser.username || dbUser.loginId,
        name: dbUser.docname || dbUser.name || dbUser.username || dbUser.loginId,
        loginId: dbUser.loginId || dbUser.username,
        department: dbUser.department || 'General Dentistry'
      });
    }

    return res.status(401).json({ message: 'Not authenticated' });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// GET doctor's personal queue
app.get('/api/patients/queue/my-queue', async (req, res) => {
  try {
    // 1. Get doctor name from Query Parameters OR Authorization Token
    let doctorName = req.query.doctor || req.query.doctorName || req.query.name;

    if (!doctorName && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        doctorName = decoded.doctorName || decoded.name;
      } catch (e) {
        console.error('Token decode error:', e.message);
      }
    }

    let query = {};

    // 2. Filter database strictly if a doctor name is present
    if (doctorName && doctorName !== 'null' && doctorName !== 'undefined') {
      // Remove prefixes like "Dr." or degrees to match database names flexibly
      const cleanName = doctorName.replace(/^dr\.?\s*/i, '').trim();
      const nameRegex = new RegExp(cleanName, 'i');

      query = {
        $or: [
          { doctor: nameRegex },
          { doctorName: nameRegex },
          { assignedDoctor: nameRegex }
        ]
      };
    }

    // 3. Filter for Today's Appointments
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    query.createdAt = { $gte: startOfDay, $lte: endOfDay };

    const queue = await Appointment.find(query).sort({ createdAt: 1 });
    return res.json(queue);

  } catch (err) {
    console.error('Error fetching queue:', err);
    return res.status(500).json({ error: 'Server error fetching queue' });
  }
});
// GET Total unique patients for logged-in doctor
app.get('/api/patients/total-count', async (req, res) => {
  try {
    const targetDoctor = req.query.doctorName || (req.user && req.user.name);
    
    let query = {};
    if (targetDoctor) {
      const cleanName = targetDoctor
        .replace(/^dr\.?\s*/i, '')
        .replace(/,?\s*(bds|mds|degree|mbbs)\.?/gi, '')
        .trim();
      const pattern = new RegExp(cleanName, 'i');

      query = {
        $or: [
          { doctor: pattern },
          { doctorName: pattern },
          { doctorId: pattern }
        ]
      };
    }

    const total = await Appointment.distinct('patientId', query);
    res.json({ total: total.length });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching total patient count' });
  }
});

// GET /api/dashboard/stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const todayAppointments = await Appointment.find({ date: todayStr });
    const totalPatients = await Patient.countDocuments();
    const pendingPayments = await Appointment.countDocuments({ paymentStatus: 'Pending' });

    res.json({
      success: true,
      todayAppointments: todayAppointments.length,
      totalPatients,
      pendingPayments
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// GET /api/doctors/dashboard-stats
app.get('/api/doctors/dashboard-stats', async (req, res) => {
  try {
    let doctorId = '';
    let doctorName = '';

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null' && token.split('.').length === 3) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded) {
            doctorId = decoded.id || decoded._id || '';
            doctorName = decoded.doctorName || decoded.name || decoded.username || '';
          }
        } catch (tokenErr) {
          console.warn("⚠️ Token verification skipped or expired:", tokenErr.message);
        }
      }
    }

    if (!doctorName && doctorId) {
      const dbUser = await User.findById(doctorId);
      if (dbUser) {
        doctorName = dbUser.docname || dbUser.name || dbUser.username || '';
      }
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const filter = { date: todayStr };

    if (doctorName) {
      const cleanDoctorName = doctorName.replace(/^Dr\.\s*/i, '').trim();
      filter.$or = [
        { doctor: { $regex: escapeRegex(cleanDoctorName),$options: 'i' } },
        { doctorName: { $regex: escapeRegex(cleanDoctorName),$options: 'i' } }
      ];
    }

    const todayAppointments = await Appointment.find(filter);
    const waitingCount = await Appointment.countDocuments({ ...filter, status: { $in: ['waiting', 'Waiting', 'in-queue'] } });
    const totalPatients = await Patient.countDocuments();

    res.json({
      success: true,
      todayCount: todayAppointments.length,
      waitingInQueue: waitingCount,
      waitingCount: waitingCount,
      totalPatients: totalPatients,
      doctorId,
      doctorName
    });
  } catch (error) {
    console.error('Error fetching doctor dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

/* ==========================================================================
   APPOINTMENT & CLINICAL API ROUTES
   ========================================================================== */

// GET Queue assigned to logged-in Doctor
// GET Queue assigned to logged-in Doctor
/* ==========================================================================
   MULTILINGUAL TRANSLATION DICTIONARY
   ========================================================================== */
const i18n = {
  en: {
    receptionPortal: "Reception Portal",
    doctorPortal: "Doctor Portal",
    loginIdLabel: "Username / ID",
    passwordLabel: "Password",
    loginIdPlaceholder: "Enter Username or ID",
    passwordPlaceholder: "••••••••",
    loginBtn: "Login",
    forgotPass: "Forgot Password?",
    serverError: "Server connection error",
    invalidCreds: "Invalid credentials"
  },
  ta: { // Tamil
    receptionPortal: "வரவேற்பறை பகுதி",
    doctorPortal: "மருத்துவர் நுழைவு",
    loginIdLabel: "பயனர் பெயர் / ஐடி",
    passwordLabel: "கடவுச்சொல்",
    loginIdPlaceholder: "பயனர் பெயர் அல்லது ஐடியை உள்ளிடவும்",
    passwordPlaceholder: "••••••••",
    loginBtn: "உள்நுழைக",
    forgotPass: "கடவுச்சொல் மறந்துவிட்டதா?",
    serverError: "சர்வர் இணைப்பு பிழை",
    invalidCreds: "தவறான கணக்கு விவரங்கள்"
  }
};

// Function to switch UI language dynamically across all data-i18n elements
function applyLanguage(lang) {
  const currentLang = i18n[lang] ? lang : 'en';
  localStorage.setItem('preferredLang', currentLang);
  document.body.setAttribute('data-lang', currentLang);
  
  const dict = i18n[currentLang];

  // Update elements with explicit data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (dict[key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = dict[key];
      } else {
        element.textContent = dict[key];
      }
    }
  });
}

/* ==========================================================================
   UI STATUS & HELPER FUNCTIONS
   ========================================================================== */
function showLoginStatus(elementId, message, type = 'error') {
  const statusBox = document.getElementById(elementId);
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.classList.remove('login-error', 'login-success');
  statusBox.classList.add(type === 'success' ? 'login-success' : 'login-error');
  statusBox.hidden = false;
}

function clearLoginError(elementId) {
  const errorBox = document.getElementById(elementId);
  if (!errorBox) return;

  errorBox.textContent = '';
  errorBox.hidden = true;
}

function isChiefDoctorLogin(loginId) {
  const formatted = String(loginId || '').trim().toUpperCase();
  return formatted.startsWith('CHIEFDOC') || formatted.includes('CHIEF');
}

function isRoleAllowed(portalType, userRole) {
  const role = String(userRole || '').toLowerCase().trim();
  if (portalType === 'reception' || portalType === 'admin') {
    return role === 'admin' || role === 'reception';
  }
  if (portalType === 'doctor') {
    return role === 'doctor' || role === 'chief_doctor' || role === 'chiefdoctor';
  }
  return false;
}

/* ==========================================================================
   AUTHENTICATION API CALL
   ========================================================================== */
async function validateLogin({ loginId, password, role }) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        loginId: loginId,
        password: password, 
        role: role 
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        valid: true,
        token: data.token,
        userRole: data.userRole || data.user?.role,
        doctorName: data.doctorName || data.user?.name || data.user?.doctorName,
        redirect: data.redirect || data.redirectUrl
      };
    } else {
      return { 
        valid: false, 
        message: data.message || 'Invalid login ID or password' 
      };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return { valid: false, message: 'Server connection error' };
  }
}

/* ==========================================================================
   EVENT LISTENERS & FORM HANDLERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Dropdown Selector Initialization
  const savedLang = localStorage.getItem('preferredLang') || 'en';
  const langSelect = document.getElementById('languageSelect');
  
  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
  }
  
  // Apply initial language setting
  applyLanguage(savedLang);

  // 2. Doctor Login Form Handling
  const doctorLoginForm = document.getElementById('doctorLoginForm');
  if (doctorLoginForm) {
    doctorLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const loginIdElem = document.getElementById('doctorLoginId');
      const passwordElem = document.getElementById('doctorPassword');
      const errorBoxId = document.getElementById('doctorLoginError') ? 'doctorLoginError' : 'doctorAlert';

      clearLoginError(errorBoxId);

      if (!loginIdElem || !passwordElem) return;

      const loginId = loginIdElem.value.trim();
      const password = passwordElem.value;

      const result = await validateLogin({ loginId, password, role: 'doctor' });

      if (result.valid) {
        if (result.userRole && !isRoleAllowed('doctor', result.userRole)) {
          showLoginStatus(errorBoxId, 'Invalid credentials for Doctor Portal.', 'error');
          return;
        }

        const doctorNameFromDB = result.doctorName || loginId;

        // Save keys required across doctor dashboard and admin pages
        localStorage.setItem('doctorName', doctorNameFromDB);
        localStorage.setItem('user', JSON.stringify({
          name: doctorNameFromDB,
          doctorName: doctorNameFromDB,
          role: result.userRole || 'doctor'
        }));

        localStorage.setItem('currentUser', JSON.stringify({
          name: doctorNameFromDB,
          role: result.userRole || 'doctor'
        }));

        const redirectPage = result.redirect || (isChiefDoctorLogin(loginId) 
          ? 'chiefdoctor-dashboard.html' 
          : 'doctor-admin.html');
          
        window.location.href = redirectPage;
        return;
      }

      showLoginStatus(errorBoxId, result.message, 'error');
    });
  }

  // 3. Reception / Admin Login Form Handling
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const loginIdElem = document.getElementById('adminLoginId');
      const passwordElem = document.getElementById('adminPassword');
      const errorBoxId = document.getElementById('adminLoginError') ? 'adminLoginError' : 'receptionAlert';

      clearLoginError(errorBoxId);

      if (!loginIdElem || !passwordElem) return;

      const loginId = loginIdElem.value.trim();
      const password = passwordElem.value;

      const result = await validateLogin({ loginId, password, role: 'admin' });

      if (result.valid) {
        if (result.userRole && !isRoleAllowed('reception', result.userRole)) {
          showLoginStatus(errorBoxId, 'Invalid credentials for Reception Portal.', 'error');
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify({
          name: loginId,
          role: result.userRole || 'admin'
        }));

        window.location.href = result.redirect || 'admin-dashboard.html';
        return;
      }

      showLoginStatus(errorBoxId, result.message, 'error');
    });
  }

  // 4. Forgot Password Modal Listeners
  const forgotModal = document.getElementById('forgotModal');
  const doctorForgotLink = document.getElementById('doctorForgotLink');
  const receptionForgotLink = document.getElementById('receptionForgotLink');
  const closeForgotBtn = document.getElementById('closeForgotBtn');

  const openModal = (e) => {
    e.preventDefault();
    if (forgotModal) forgotModal.classList.remove('hidden');
  };

  if (doctorForgotLink) doctorForgotLink.addEventListener('click', openModal);
  if (receptionForgotLink) receptionForgotLink.addEventListener('click', openModal);

  if (closeForgotBtn && forgotModal) {
    closeForgotBtn.addEventListener('click', () => {
      forgotModal.classList.add('hidden');
    });
  }
});
// GET Live Appointments for Today Grouped by Doctor
app.get('/api/appointments/today-by-doctor', async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const doctors = [
      "Dr. C. Jeganthpuri",
      "Dr. S. Manimozhi"
    ];

    const todayAppointments = await Appointment.find({ date: todayStr }).sort({ createdAt: 1 });

    const allPatients = await Patient.find({}, 'patientCustomId patientId name phone mobile');
    const patientMap = new Map();
    allPatients.forEach(p => {
      const key = p.phone || p.mobile || p.name;
      const val = p.patientCustomId || p.patientId || p._id;
      if (key) patientMap.set(key, val);
    });

    const result = doctors.map(doctorName => {
      const cleanDocName = doctorName.replace(/^Dr\.\s*/i, '').trim();
      const doctorBookings = todayAppointments.filter(app => {
        const docField = app.doctor || app.doctorName || '';
        return docField.toLowerCase().includes(cleanDocName.toLowerCase());
      });

      return {
        doctorName: doctorName,
        count: doctorBookings.length,
        appointments: doctorBookings.map((app, index) => ({
          queueNo: index + 1,
          patientId: patientMap.get(app.phone) || patientMap.get(app.patientName) || 'N/A',
          patientName: app.patientName,
          phone: app.phone,
          timeSlot: app.timeSlot,
          status: app.status || 'Waiting'
        }))
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching live appointments by doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor appointments' });
  }
});

app.get('/api/patients/today-queue', async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const todayPatients = await Patient.find({ visitDate: todayStr }).sort({ queueNo: 1 });
    res.json(todayPatients);
  } catch (err) {
    res.status(500).json({ message: 'Error loading today queue' });
  }
});

// Patient search route
app.get('/api/patient-search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  try {
    const patient = await Patient.findOne({
      $or: [
        { patientCustomId: query },
        { patientId: query },
        { phone: query },
        { mobile: query },
        { name: { $regex: escapeRegex(query),$options: 'i' } }
      ]
    });

    if (!patient) {
      return res.status(404).json({ message: 'No patient found' });
    }

    const cleanPhone = patient.phone ? patient.phone.trim() : (patient.mobile ? patient.mobile.trim() : '');

    const appointments = await Appointment.find({
      $or: [
        { phone: cleanPhone },
        { patientId: patient._id },
        { patientName: { $regex: escapeRegex(patient.name),$options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    const serviceHistory = appointments.map(app => ({
      visitDate: app.date || app.createdAt,
      visitTime: app.timeSlot || 'N/A',
      paymentAmount: app.doctorFee || 0,
      paymentStatus: app.paymentStatus || 'Pending',
      paymentMode: app.paymentMode || '-'
    }));

    res.json({
      patientId: patient.patientCustomId || patient.patientId || patient._id.toString(),
      name: patient.name,
      phone: patient.phone || patient.mobile || '',
      gender: patient.gender || 'N/A',
      bloodGroup: patient.bloodGroup || 'N/A',
      serviceHistory: serviceHistory
    });

  } catch (error) {
    console.error('Mongoose Query Error:', error);
    res.status(500).json({ error: 'Server error searching for patient' });
  }
});

// Auto-Lookup patient by phone
app.get('/api/patients/search-by-phone', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    let patient = await Patient.findOne({ 
      $or: [{ phone: phone }, { mobile: phone }] 
    }).sort({ createdAt: -1 });

    if (!patient) {
      const appointment = await Appointment.findOne({ phone: phone }).sort({ createdAt: -1 });
      if (appointment) {
        return res.json({
          success: true,
          patientId: appointment.patientId || appointment._id,
          patientName: appointment.patientName,
          phone: appointment.phone
        });
      }
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      patientId: patient.patientCustomId || patient.patientId || patient._id,
      patientName: patient.name || '',
      phone: patient.phone || patient.mobile || ''
    });

  } catch (err) {
    console.error('Error looking up patient by phone:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Book Appointment & Register Patient
app.post('/api/appointments', async (req, res) => {
  try {
    const { 
      userType, 
      name, 
      phone, 
      doctor, 
      doctorName, 
      doctorId, 
      department, 
      date, 
      timeSlot, 
      symptoms, 
      gender, 
      bloodGroup, 
      dob, 
      age 
    } = req.body;

    let patientId = null;

    if (userType === 'new') {
      let existingPatient = await Patient.findOne({ $or: [{ phone }, { mobile: phone }] });

      if (!existingPatient) {
        const counter = await Counter.findOneAndUpdate(
          { id: 'patient_id' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        const customId = `PAT-${counter.seq}`;

        existingPatient = new Patient({ 
          patientCustomId: customId,
          patientId: customId,
          name, 
          phone,
          mobile: phone,
          gender: gender || 'Not Specified',
          bloodGroup: bloodGroup || 'N/A',
          dob: dob || '',
          age: age || ''
        });

        await existingPatient.save();
      }

      patientId = existingPatient._id;
    } else {
      const existingPatient = await Patient.findOne({ $or: [{ phone }, { mobile: phone }] });
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found in clinical records.' });
      }
      patientId = existingPatient._id;
    }

    const assignedDoctor = doctor || doctorName || 'Unassigned';

    const appointment = new Appointment({
      patientId,
      patientName: name,
      phone,
      doctorId: doctorId || assignedDoctor,
      doctor: assignedDoctor,
      doctorName: doctorName || assignedDoctor,
      department,
      date,
      timeSlot,
      symptoms
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment created successfully', appointment });

  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
});

// GET Appointments for Today
app.get('/api/appointments', async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      $or: [
        { date: todayStr },
        { createdAt: { $gte: startOfToday,$lte: endOfToday } }
      ]
    }).sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

// GET Single Appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching appointment', details: err.message });
  }
});

// Update Doctor Fee
app.patch('/api/appointments/:id/doctor-fee', async (req, res) => {
  try {
    const { doctorFee } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        doctorFee,
        remainingBalance: doctorFee
      },
      { new: true }
    );
    res.json({ message: 'Doctor fee updated', appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update doctor fee', details: err.message });
  }
});

// Update Payment Details
app.patch('/api/appointments/:id/pay', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
    if (req.body.remainingBalance !== undefined) updateData.remainingBalance = req.body.remainingBalance;
    if (req.body.paymentMode !== undefined) updateData.paymentMode = req.body.paymentMode;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    res.json({ message: 'Payment details updated', appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment details', details: err.message });
  }
});

// Delete Appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment cancelled successfully', id });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error while deleting appointment' });
  }
});

/* ==========================================================================
   QUEUE MAINTENANCE TASK
   ========================================================================== */

async function archivePastAppointments() {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Appointment.updateMany(
      {
        $or: [
          { date: { $lt: todayStr } },
          { createdAt: { $lt: startOfToday } }
        ],
        status: { $ne: 'Completed' }
      },
      {
        $set: { status: 'Expired' }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Queue Maintenance] Archived ${result.modifiedCount} appointment(s) from previous days.`);
    }
  } catch (err) {
    console.error('[Queue Maintenance Error]:', err);
  }
}

// Execute past appointments archiving on boot
archivePastAppointments();

// Serve login page at root URL and /login.html
app.get(['/', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ==========================================================================
   START SERVER
   ========================================================================== */
app.listen(PORT, () => {
  console.log(`🚀 ISSAI Dental Portal active at http://localhost:${PORT}`);
});