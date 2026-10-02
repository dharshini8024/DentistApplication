/* ==========================================================================
   DOCTOR DASHBOARD CORE LOGIC & PROFILE HANDLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // Initialize profile loading
  loadDoctorProfile();

  // Initialize initial event listeners if elements exist
  initializeDashboard();

  // Load active patient queue
  loadPatientQueue();
});

/**
 * 1. DOCTOR PROFILE LOADER
 * Reads dynamic doctor identity from storage/API and handles language prefixes.
 */
   async function loadDoctorProfile() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found. Redirecting to login page...');
      window.location.href = 'index.html'; // Changed from login.html
      return;
    }

    const response = await fetch('/api/doctor/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = 'index.html'; // Changed from login.html
      return;
    }

    if (response.ok) {
      const data = await response.json();
      const docNameElem = document.getElementById('doctorNameDisplay');
      if (docNameElem && data.name) {
        docNameElem.innerText = data.name;
      }
    }
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
  }
}
function updateProfileDOM(doctorName) {
  // Target all possible DOM elements where the doctor's name should be rendered
  const selectors = ['#welcomeDoctorName', '#doctorName', '#currentDoctorName', '.logged-in-doctor', '#doctorTitle'];
  
  let updated = false;
  selectors.forEach(selector => {
    const elem = document.querySelector(selector);
    if (elem) {
      elem.textContent = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;
      updated = true;
    }
  });

  if (!updated) {
    console.warn("⚠️ No dynamic doctor profile element (e.g. #welcomeDoctorName or #doctorName) found in the HTML.");
  }
}
/**
 * 2. DASHBOARD INITIALIZATION & EVENT LISTENERS
 */
function initializeDashboard() {
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', function (e) {
      applyLanguage(e.target.value);
    });
  }
}

/**
 * 3. LANGUAGE / TRANSLATION HANDLER (i18n)
 */
const translations = {
  en: {
    doctorPrefix: "Dr.",
    clinicTitle: "ISSAI Dental Clinic",
    clinicSubTitle: "(இசை பல் மருத்துவமனை)",
    logoutBtn: "Logout",
    queueTitle: "Patient Queue",
    completedHeader: "Completed Today",
    completeAndNextBtn: "✓ Complete & Next",
    inConsultationHeader: "In Consultation",
    selectPatientPrompt: "Select a Patient",
    patientHistoryHeader: "Patient Medical & Service History",
    primaryComplaintLabel: "Primary Complaint",
    chiefComplaintsLabel: "Chief Complaints & Symptoms",
    medicalHistoryLabel: "General Medical History",
    habitsLabel: "Habits & Risk Factors",
    extraOralLabel: "Extra-Oral Examination",
    intraOralLabel: "Intra-Oral Examination",
    examNotesLabel: "Clinical Finding Notes",
    investigationLabel: "Investigation List",
    treatmentPlanLabel: "Treatment Plan & Fee Estimation",
    docPlanLabel: "Doctor Advised Plan",
    estimatedFeeBreakdown: "Estimated Fee Breakdown",
    procedureDescHeader: "Procedure / Service Description",
    estimatedAmountHeader: "Estimated Amount (₹)",
    totalEstimateLabel: "Total Estimated Fee:",
    addFeeBtn: "+ Add Fee Item",
    prescriptionPadLabel: "Prescription Pad",
    medicineNameHeader: "Medicine Name",
    dosageHeader: "Dosage (M-A-N)",
    timingHeader: "Timing",
    daysHeader: "Days",
    addMedicineBtn: "+ Add Medicine",
    nextVisitHeader: "Next Visit Schedule",
    patientConsentHeader: "Patient Rights & Consent",
    consentNote1: "Understand that treatments are done for health benefits and obtain complete care.",
    consentNote2: "Discuss proposed treatments directly with the dentist.",
    consentLabel: "Patient / Guardian Informed Consent Obtained",
    saveRecordBtn: "Save Complete Clinical Record",

    phPrimaryComplaint: "Enter primary complaint (e.g. Pain in lower right back tooth)...",
    phChiefComplaints: "Enter patient reported symptoms or previous dental treatment history...",
    phExamNotes: "Enter specific clinical finding details, probe measurements, observation notes...",
    phInvestigationText: "e.g., IOPA X-Ray #16, OPG, RBS Blood Test",
    phDocPlan: "1. Consultation\n2. X-Ray\n3. Scaling",
    phNextVisit: "e.g., 21/09/2026 at 5:00 PM or After 1 week"
  },

  en_ta: {
    doctorPrefix: "Dr.",
    clinicTitle: "ISSAI Dental Clinic",
    clinicSubTitle: "(இசை பல் மருத்துவமனை)",
    logoutBtn: "Veliyaeru",
    queueTitle: "Sikitchaiyaalar Varisai",
    completedHeader: "Indru Mudinthavai",
    completeAndNextBtn: "✓ Mudithhu Aduttha Sikitchaiyaalar",
    inConsultationHeader: "Aalosanaiyil",
    selectPatientPrompt: "Sikitchaiyaalarai Thaerndheduthavum",
    patientHistoryHeader: "Sikitchaiyaalar Maruthuva Varalaaru",
    primaryComplaintLabel: "Mukhya Prachhanai",
    chiefComplaintsLabel: "Mukhya Arigurigal",
    medicalHistoryLabel: "Pothu Maruthuva Varalaaru",
    habitsLabel: "Pazhakka Vazhakangal & Abaayangal",
    extraOralLabel: "Vaai Veli Soozhnilai Soothanai",
    intraOralLabel: "Vaai Ul Soothanai",
    examNotesLabel: "Soothanai Kurippugal",
    investigationLabel: "Aaraaichhi Varisaiggal",
    treatmentPlanLabel: "Sikitchai Thittam & Kattam",
    docPlanLabel: "Maruthuvar Aalosana Thittam",
    estimatedFeeBreakdown: "Kattam Vivaram",
    procedureDescHeader: "Sikitchai Vivaram",
    estimatedAmountHeader: "Kattam (₹)",
    totalEstimateLabel: "Mothha Kattam:",
    addFeeBtn: "+ Fee Item Serkkavum",
    prescriptionPadLabel: "Marundhu Seettu",
    medicineNameHeader: "Marundhu Peyar",
    dosageHeader: "Alavu (Kaalai-Maddhiyam-Iravu)",
    timingHeader: "Naeram",
    daysHeader: "Naatgal",
    addMedicineBtn: "+ Marundhu Serkkavum",
    nextVisitHeader: "Aduttha Santhippu அட்டவணை",
    patientConsentHeader: "Sikitchaiyaalar Urimaigal & Sammatham",
    consentNote1: "Sikitchai nanmaikkaga seyyapadugirathu enpathai purinthukolla vendum.",
    consentNote2: "Maruthuvaridam neraadiyaga pesi vilakkam peravum.",
    consentLabel: "Sikitchaiyaalar Sammatham Perappattathu",
    saveRecordBtn: "Sikitchai Vivarangalai Semikka",

    phPrimaryComplaint: "Mukhya prachhanaiyai enter seyyavum (e.g. Valathu pakkathu pal vali)...",
    phChiefComplaints: "Arigurigal matrum pazhaya maruthuva varalaaru enter seyyavum...",
    phExamNotes: "Soothanai kurippugal enter seyyavum...",
    phInvestigationText: "e.g., X-Ray, Blood Test...",
    phDocPlan: "1. Consultation\n2. X-Ray",
    phNextVisit: "e.g., 21/09/2026 maalai 5:00 PM"
  },

  ta: {
    doctorPrefix: "டாக்டர்",
    clinicTitle: "ISSAI Dental Clinic",
    clinicSubTitle: "(இசை பல் மருத்துவமனை)",
    logoutBtn: "வெளியேறு",
    queueTitle: "நோயாளி வரிசை",
    completedHeader: "இன்று முடித்தவை",
    completeAndNextBtn: "✓ முடித்து அடுத்த நோயாளி",
    inConsultationHeader: "ஆலோசனையில்",
    selectPatientPrompt: "நோயாளியை தேர்ந்தெடுக்கவும்",
    patientHistoryHeader: "நோயாளி மருத்துவ வரலாறு",
    primaryComplaintLabel: "முதன்மை பிரச்சனை",
    chiefComplaintsLabel: "முதன்மை அறிகுறிகள்",
    medicalHistoryLabel: "பொது மருத்துவ வரலாறு",
    habitsLabel: "பழக்க வழக்கங்கள் & அபாயங்கள்",
    extraOralLabel: "வாய் வெளி பரிசோதனை",
    intraOralLabel: "வாய் உள் பரிசோதனை",
    examNotesLabel: "பரிசோதனை குறிப்புகள்",
    investigationLabel: "ஆராய்ச்சி வரிசைகள்",
    treatmentPlanLabel: "சிகிச்சை திட்டம் & கட்டணம்",
    docPlanLabel: "மருத்துவர் ஆலோசனை திட்டம்",
    estimatedFeeBreakdown: "கட்டண விவரம்",
    procedureDescHeader: "சிகிச்சை விவரம்",
    estimatedAmountHeader: "கட்டணம் (₹)",
    totalEstimateLabel: "மொத்த கட்டணம்:",
    addFeeBtn: "+ கட்டண விவரம் சேர்க்கவும்",
    prescriptionPadLabel: "மருந்து சீட்டு",
    medicineNameHeader: "மருந்து பெயர்",
    dosageHeader: "அளவு (காலை-மதியம்-இரவு)",
    timingHeader: "நேரம்",
    daysHeader: "நாட்கள்",
    addMedicineBtn: "+ மருந்து சேர்க்கவும்",
    nextVisitHeader: "அடுத்த சந்திப்பு அட்டவணை",
    patientConsentHeader: "நோயாளி உரிமைகள் & சம்மதம்",
    consentNote1: "சிகிச்சை நன்மைக்காக செய்யப்படுகிறது என்பதை புரிந்துகொள்ள வேண்டும்.",
    consentNote2: "மருத்துவரிடம் நேரடியாக பேசி விளக்கம் பெறவும்.",
    consentLabel: "நோயாளி சம்மதம் பெறப்பட்டது",
    saveRecordBtn: "சிகிச்சை விவரங்களை சேமிக்க",

    phPrimaryComplaint: "முதன்மை பிரச்சனையை உள்ளிடவும் (எ.கா. வலது கீழ் பல் வலி)...",
    phChiefComplaints: "அறிகுறிகள் மற்றும் முந்தைய மருத்துவ வரலாற்றை உள்ளிடவும்...",
    phExamNotes: "பரிசோதனை குறிப்புகளை உள்ளிடவும்...",
    phInvestigationText: "எ.கா., X-Ray, ரத்த பரிசோதனை...",
    phDocPlan: "1. ஆலோசனை\n2. எக்ஸ்-ரே",
    phNextVisit: "எ.கா., 21/09/2026 மாலை 5:00 PM"
  }
};

function applyLanguage(lang) {
  const selectedLang = translations[lang] ? lang : 'en';
  const dict = translations[selectedLang];

  localStorage.setItem('selectedLang', selectedLang);

  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (dict[key]) {
      elem.textContent = dict[key];
    }
  });

  const placeholderMap = {
    'primaryComplaint': 'phPrimaryComplaint',
    'chiefComplaints': 'phChiefComplaints',
    'examNotes': 'phExamNotes',
    'investigationText': 'phInvestigationText',
    'docAdvisedPlan': 'phDocPlan',
    'nextVisitInput': 'phNextVisit'
  };

  Object.keys(placeholderMap).forEach(id => {
    const inputElem = document.getElementById(id);
    const translationKey = placeholderMap[id];
    if (inputElem && dict[translationKey]) {
      inputElem.placeholder = dict[translationKey];
    }
  });

  loadDoctorProfile();
}

/**
 * 4. FEE & PROCEDURE TABLE DYNAMICS
 */
function addFeeRow(description = 'Consultation', amount = '500') {
  const feeBody = document.getElementById('feeItemsBody');
  if (!feeBody) return;

  const row = document.createElement('tr');
  row.className = 'fee-item-row';
  row.innerHTML = `
    <td>
      <input type="text" class="fee-desc" placeholder="e.g. Scaling / Root Canal" value="${description}">
    </td>
    <td>
      <input type="number" class="fee-amount" placeholder="0.00" min="0" value="${amount}" oninput="calculateTotalEstimate()">
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn-remove-row" onclick="removeFeeRow(this)">✕</button>
    </td>
  `;

  feeBody.appendChild(row);
  calculateTotalEstimate();
}

function removeFeeRow(btn) {
  const row = btn.closest('tr');
  if (row) {
    row.remove();
    calculateTotalEstimate();
  }
}

function calculateTotalEstimate() {
  const amountInputs = document.querySelectorAll('.fee-amount');
  let total = 0;

  amountInputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) total += val;
  });

  const totalDisplay = document.getElementById('docEstimatedCost');
  if (totalDisplay) {
    totalDisplay.textContent = total.toFixed(2);
  }
}

function addPrescriptionRow(med = '', dose = '', timing = '', days = '') {
  const body = document.getElementById('prescriptionBody');
  if (!body) return;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="med-name" placeholder="Medicine Name" value="${med}" /></td>
    <td><input type="text" class="med-dose" placeholder="1 - 0 - 1" value="${dose}" /></td>
    <td><input type="text" class="med-timing" placeholder="After Food" value="${timing}" /></td>
    <td><input type="text" class="med-days" placeholder="5 days" value="${days}" /></td>
    <td style="text-align:center;"><button type="button" class="btn-remove-row" onclick="removeFeeRow(this)">✕</button></td>
  `;
  body.appendChild(row);
}

/**
 * 5. QUEUE MANAGEMENT & PATIENT SELECTION
 */
async function loadPatientQueue() {
  const queueList = document.getElementById('queueList');
  if (!queueList) return;

  try {
    const res = await fetch('/api/appointments');
    if (!res.ok) throw new Error('Failed to fetch queue');
    const appointments = await res.json();

    if (appointments.length === 0) {
      queueList.innerHTML = '<p style="color:#777;">No patients waiting.</p>';
      return;
    }

    queueList.innerHTML = '';
    appointments.forEach(apt => {
      const pName = apt.patientId?.fullName || apt.patientName || 'Unknown Patient';
      const pId = apt.patientId?._id || apt.patientId || apt._id;
      const reason = apt.reason || 'General Consultation';

      const div = document.createElement('div');
      div.style.cssText = 'padding:10px; background:#fff; margin-bottom:8px; border-radius:4px; border:1px solid #ccc; cursor:pointer;';
      div.innerHTML = `<strong>${pName}</strong><br><small style="color:#666;">Reason: ${reason}</small>`;
      div.onclick = () => selectPatientFromQueue(pId, pName, reason);
      queueList.appendChild(div);
    });
  } catch (err) {
    console.error("Queue load error:", err);
    queueList.innerHTML = '<p style="color:red;">Error loading queue.</p>';
  }
}

async function selectPatientFromQueue(patientId, patientName, visitReason) {
  const activeName = document.getElementById('activePatientName');
  const activeIdInput = document.getElementById('activePatientId');
  const primaryCompInput = document.getElementById('primaryComplaint');

  if (activeName) activeName.textContent = patientName;
  if (activeIdInput) activeIdInput.value = patientId;
  if (primaryCompInput && visitReason) primaryCompInput.value = visitReason;

  console.log(`Loaded patient ID: ${patientId}`);

  // Fetch and display Patient Visit History
  await fetchAndDisplayPatientHistory(patientId);
}

/**
 * 6. HISTORICAL PATIENT RECORDS LOADER
 */
async function fetchAndDisplayPatientHistory(patientId) {
  const historyContainer = document.getElementById('patientHistoryList');
  if (!historyContainer) return;

  historyContainer.innerHTML = '<p style="color:#666;">Fetching past records...</p>';

  try {
    const res = await fetch(`/api/patients/${patientId}/history`);
    if (!res.ok) throw new Error('Failed to fetch patient history');
    
    const data = await res.json();
    const history = data.history || [];

    if (history.length === 0) {
      historyContainer.innerHTML = '<p style="color:#777;">No past visit records found for this patient.</p>';
      return;
    }

    historyContainer.innerHTML = '';
    history.forEach((visit, idx) => {
      const visitDate = visit.createdAt ? new Date(visit.createdAt).toLocaleString() : `Visit #${idx + 1}`;
      const div = document.createElement('div');
      div.className = 'history-item';

      let prescriptionHTML = '';
      if (visit.prescription && visit.prescription.length > 0) {
        prescriptionHTML = `
          <p style="margin:5px 0 0 0; font-weight:bold;">Prescribed Medicines:</p>
          <ul style="margin:2px 0; padding-left:20px; font-size:13px;">
            ${visit.prescription.map(p => `<li>${p.medicineName} -${p.dosage} (${p.timing}) for${p.days}</li>`).join('')}
          </ul>
        `;
      }

      let fileHTML = '';
      if (visit.investigationFiles && visit.investigationFiles.length > 0) {
        fileHTML = `
          <p style="margin:5px 0 0 0; font-weight:bold;">Attached Files/X-Rays:</p>
          <ul class="attachment-list" style="font-size:13px;">
            ${visit.investigationFiles.map(f => `<li><a href="${f.fileUrl}" target="_blank">${f.originalName || 'View Attachment'}</a></li>`).join('')}
          </ul>
        `;
      }

      div.innerHTML = `
        <div style="font-weight:bold; color:#1a252f;">📅 ${visitDate} - ${visit.doctorName || 'Doctor'}</div>
        <div style="font-size:13px; margin-top:4px;">
          <strong>Primary Complaint:</strong> ${visit.primaryComplaint || 'N/A'}<br>
          <strong>Doctor Advised Plan:</strong> ${visit.docAdvisedPlan || 'N/A'}<br>
          <strong>Notes:</strong> ${visit.clinicalNotes || 'None'}
        </div>
        ${prescriptionHTML}
        ${fileHTML}
      `;

      historyContainer.appendChild(div);
    });

  } catch (err) {
    console.error("History fetch error:", err);
    historyContainer.innerHTML = '<p style="color:red; font-size:12px;">Could not load past visits.</p>';
  }
}

/**
 * 7. FORM SUBMISSION HANDLER
 */
async function submitClinicalRecord(event) {
  if (event) event.preventDefault();

  const consentCheckbox = document.getElementById('consentCheck');
  if (consentCheckbox && !consentCheckbox.checked) {
    alert("Please verify patient consent before saving the record.");
    return false;
  }

  const patientId = document.getElementById('activePatientId')?.value;
  if (!patientId) {
    alert("Please select a patient from the queue first.");
    return false;
  }

  // Gather fee items
  const feeRows = document.querySelectorAll('#feeItemsBody tr');
  const items = [];
  feeRows.forEach(row => {
    const description = row.querySelector('.fee-desc')?.value;
    const amount = parseFloat(row.querySelector('.fee-amount')?.value || '0');
    if (description) items.push({ description, amount });
  });

  // Gather prescription items
  const medRows = document.querySelectorAll('#prescriptionBody tr');
  const prescription = [];
  medRows.forEach(row => {
    const medicineName = row.querySelector('.med-name')?.value;
    const dosage = row.querySelector('.med-dose')?.value;
    const timing = row.querySelector('.med-timing')?.value;
    const days = row.querySelector('.med-days')?.value;
    if (medicineName) prescription.push({ medicineName, dosage, timing, days });
  });

  const formData = new FormData();
  formData.append('patientId', patientId);
  formData.append('doctorName', document.getElementById('doctorName')?.textContent || '');
  formData.append('primaryComplaint', document.getElementById('primaryComplaint')?.value || '');
  formData.append('chiefComplaints', document.getElementById('chiefComplaints')?.value || '');
  formData.append('medicalHistory', document.getElementById('medicalHistory')?.value || '');
  formData.append('habits', document.getElementById('habitsInput')?.value || '');
  formData.append('extraOralFindings', document.getElementById('extraOralInput')?.value || '');
  formData.append('clinicalNotes', document.getElementById('examNotes')?.value || '');
  formData.append('investigationText', document.getElementById('investigationText')?.value || '');
  formData.append('docAdvisedPlan', document.getElementById('docAdvisedPlan')?.value || '');
  formData.append('totalFee', parseFloat(document.getElementById('docEstimatedCost')?.textContent || '0'));
  formData.append('items', JSON.stringify(items));
  formData.append('prescription', JSON.stringify(prescription));
  formData.append('nextVisit', document.getElementById('nextVisitInput')?.value || '');

  const fileInput = document.getElementById('investigationFiles');
  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('investigationFiles', fileInput.files[i]);
    }
  }

  try {
    const res = await fetch('/api/clinical-records', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert("Clinical record saved successfully!");
      document.getElementById('clinicalForm').reset();
      fetchAndDisplayPatientHistory(patientId);
      return true;
      // Reset the form
  document.getElementById('clinicalRecordForm').reset();
  
  // Re-apply today's date automatically after form reset
  setVisitDateToToday();
  
  calculateTotalEstimate();
  loadQueueData();
    } else {
      const errData = await res.json();
      alert(`Save failed: ${errData.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Submission error:", err);
    alert("Network error saving clinical record.");
  }

  return false;
}

/* ==========================================================================
   AUTO-DRIVEN TODAY'S DATE INITIALIZATION
   ========================================================================== */

function setVisitDateToToday() {
  const visitDateInput = document.getElementById('visitDate');
  if (visitDateInput) {
    const today = new Date();
    // Formats local date to YYYY-MM-DD required by <input type="date">
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    visitDateInput.value = `${year}-${month}-${day}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Automatically populate Visit Date input on page load
  setVisitDateToToday();

  // Language Dropdown Listener
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => switchLanguage(e.target.value));
  }

  // Load Initial Queue Data
  loadQueueData();
  calculateTotalEstimate();
});

/**
 * 8. LOGOUT HANDLER
 */
function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// 9. INITIALIZE ON DOM LOAD
document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('languageSelect');
  const savedLang = localStorage.getItem('selectedLang') || 'en';

  if (langSelect) {
    langSelect.value = savedLang;
  }

  applyLanguage(savedLang);
  addFeeRow(); // Pre-populate default fee row
});
window.logout = function () {
  // 1. Clear saved user session and tokens from local storage
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('doctorName');
  sessionStorage.clear();

  // 2. Redirect to your login page
  window.location.href = 'index.html'; // Update filename if your login page has a different name (e.g. index.html)
};