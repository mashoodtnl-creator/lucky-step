// ===== DATABASE & CONFIG =====
let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  notices: [],
  chat: [],
  feedback: [],
  excludedWinners: []
};

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentMonth = new Date().toISOString().slice(0,7);
let currentLang = localStorage.getItem('lang') || 'ml';
let wheelSpinning = false;
const TOTAL_MONTHS = 25;

// ===== INITIALIZE =====
window.onload = () => {
  console.log('App Loading...');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.log('SW failed:', e));
  }

  setTimeout(() => {
    const splash = document.getElementById('splash');
    const mainContainer = document.getElementById('mainContainer');

    if(splash) splash.style.display = 'none';
    if(mainContainer) mainContainer.style.display = 'block';

    console.log('Splash hidden, loading app...');
    initApp();
  }, 3000);

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  updateLanguage();
};

function initApp() {
  console.log('Init app, currentUser:', currentUser);
  try {
    if(currentUser === 'admin') {
      showAdminPage();
    } else if(currentUser && currentUser.phone) {
      memberAutoLogin();
    }
  } catch(e) {
    console.error('Init Error:', e);
    document.getElementById('loginPage').classList.remove('hidden');
  }
}

// ===== LANGUAGE =====
function toggleLang() {
  currentLang = currentLang === 'ml'? 'en' : 'ml';
  localStorage.setItem('lang', currentLang);
  updateLanguage();
}

function updateLanguage() {
  document.getElementById('langBtn').textContent = currentLang === 'ml'? 'EN' : 'ML';
  document.querySelectorAll('[data-ml]').forEach(el => {
    el.textContent = el.getAttribute(`data-${currentLang}`);
  });
  document.querySelectorAll('[data-ml][placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${currentLang}`);
  });
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('darkBtn').innerHTML = isDark? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
}

// ===== DATABASE =====
function saveDB() {
  try {
    localStorage.setItem('mashoodKuriDB', JSON.stringify(db));
    return true;
  } catch(e) {
    alert('❌ Storage Full! Clear browser data.');
    return false;
  }
}

// ===== AUTH =====
function showLogin(type) {
  document.getElementById('loginPage').classList.add('hidden');
  if(type === 'admin') document.getElementById('adminLoginBox').classList.remove('hidden');
  else document.getElementById('memberLoginBox').classList.remove('hidden');
}

function backToLogin() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('loginPage').classList.remove('hidden');
}

function showRegister() {
  if(db.members.length >= TOTAL_MONTHS) {
    alert(`❌ Maximum ${TOTAL_MONTHS} members only!`);
    return;
  }
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('registerBox').classList.remove('hidden');
}

function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  if(pass === db.admin.password) {
    currentUser = 'admin';
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAdminPage();
  } else {
    alert('❌ തെറ്റായ Password!');
  }
}

function memberLogin() {
  const phone = document.getElementById('memberPhone').value;
  const pass = document.getElementById('memberPass').value;
  const member = db.members.find(m => m.phone === phone && m.password === pass);
  if(member){
    currentUser = member;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    memberAutoLogin();
  } else {
    alert('❌ തെറ്റായ Login വിവരങ്ങൾ');
  }
}

function memberRegister() {
  if(!document.getElementById('termsCheck').checked) {
    alert('❌ Terms & Conditions അംഗീകരിക്കണം!');
    return;
  }
  if(db.members.length >= TOTAL_MONTHS) {
    alert(`❌ Maximum ${TOTAL_MONTHS} members only!`);
    return;
  }

  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPass').value;
  const amount = parseInt(document.getElementById('regAmount').value);

  if(!name ||!phone ||!pass ||!amount){
    alert('❌ എല്ലാ വിവരങ്ങളും നൽകുക');
    return;
  }
  if(db.members.some(m => m.phone === phone)) {
    alert('❌ ഈ Phone Number already registered!');
    return;
  }

  db.members.push({
    name,
    phone,
    password: pass,
    amount,
    active: true,
    joinDate: new Date().toISOString()
  });
  saveDB();
  alert('✅ Registration Successful');
  backToLogin();
}

function memberAutoLogin() {
  document.querySelectorAll('.login-box,#loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('memberPage').classList.remove('hidden');
  document.getElementById('memberNameNav').textContent = currentUser.name;
  document.getElementById('memName').textContent = currentUser.name;
  document.getElementById('memPhone').textContent = currentUser.phone;
  document.getElementById('memAmount').textContent = "₹" + currentUser.amount;

  const payments = db.payments[currentMonth] || {};
  const paid = payments[currentUser.phone] || 0;
  const statusDiv = document.getElementById('memPaymentStatus');
  if(statusDiv) {
    statusDiv.innerHTML = paid >= currentUser.amount?
      `<p style="color:green;">✅ ${currentMonth} - Paid ₹${paid}</p>` :
      `<p style="color:orange;">⏳ ${currentMonth} - Pending ₹${paid}/${currentUser.amount}</p