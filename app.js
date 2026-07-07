// ===== DATABASE & CONFIG =====
let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  notices: [],
  chat: [],
  feedback: [],
  excludedWinners: [] // ← പുതിയത്: Win ആയിട്ടും wheel-ൽ വരേണ്ടവർ
};

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentMonth = new Date().toISOString().slice(0,7);
let currentLang = localStorage.getItem('lang') || 'ml';
let wheelSpinning = false;
const TOTAL_MONTHS = 25;

// ===== INITIALIZE =====
window.onload = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.log('SW failed:', e));
  }

  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    initApp();
  }, 3000);

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  updateLanguage();
};

function initApp() {
  if(currentUser === 'admin') {
    showAdminPage();
  } else if(currentUser && currentUser.phone) {
    memberAutoLogin();
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
      `<p style="color:orange;">⏳ ${currentMonth} - Pending ₹${paid}/${currentUser.amount}</p>`;
  }

  let paidCount = 0;
  Object.values(db.payments).forEach(monthPayments => {
    if(monthPayments[currentUser.phone] >= currentUser.amount) paidCount++;
  });
  document.getElementById('paidMonths').textContent = paidCount;

  renderMemberWinners();
  renderMemberChat();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  location.reload();
}

// ===== ADMIN =====
function showAdminPage() {
  document.querySelectorAll('.login-box, #loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('adminPage').classList.remove('hidden');
  updateStats();
  renderAdminMembers();
  renderCollection();
  renderReport();
  loadMonths();
  renderRecentWinners();
  renderAllWinners();
  renderChat();
  renderFeedback();
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
  const tabId = 'admin' + tab.charAt(0).toUpperCase() + tab.slice(1);
  document.getElementById(tabId).classList.remove('hidden');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  if(event && event.target) event.target.closest('a').classList.add('active');
  if(window.innerWidth < 768) toggleSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function updateStats() {
  const totalMembers = db.members.length;
  const thisMonthPayments = db.payments[currentMonth] || {};
  const paidCount = Object.keys(thisMonthPayments).length;
  const totalCollection = Object.values(thisMonthPayments).reduce((sum, amt) => sum + amt, 0);
  document.getElementById('totalMembers').textContent = totalMembers;
  document.getElementById('paidMembers').textContent = paidCount;
  document.getElementById('pendingMembers').textContent = totalMembers - paidCount;
  document.getElementById('totalCollection').textContent = '₹' + totalCollection;
  const select = document.getElementById('manualWinner');
  if(select) {
    select.innerHTML = db.members.map(m => `<option value="${m.phone}">${m.name} - ${m.phone}</option>`).join('');
  }
}

// ===== MEMBERS CRUD =====
function addMemberByAdmin() {
  if(db.members.length >= TOTAL_MONTHS) {
    alert(`❌ Maximum ${TOTAL_MONTHS} members only!`);
    return;
  }

  const name = document.getElementById('newMemName').value.trim();
  const phone = document.getElementById('newMemPhone').value.trim();
  const pass = document.getElementById('newMemPass').value;
  const amount = parseInt(document.getElementById('newMemAmount').value);

  if(!name ||!phone ||!pass ||!amount) {
    alert('❌ എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }
  if(db.members.some(m => m.phone === phone)) {
    alert('❌ ഈ Phone Number already ഉണ്ട്!');
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

  if(saveDB()) {
    renderAdminMembers();
    updateStats();
    document.getElementById('newMemName').value = '';
    document.getElementById('newMemPhone').value = '';
    document.getElementById('newMemPass').value = '';
    document.getElementById('newMemAmount').value = '';
    alert(`✅ Member Added! Total: ${db.members.length}/${TOTAL_MONTHS}`);
  }
}

function renderAdminMembers() {
  const search = document.getElementById('searchMember')?.value.toLowerCase() || '';
  const list = document.getElementById('adminMembersList');
  if(!list) return;

  const filtered = db.members.filter(m =>
    m.name.toLowerCase().includes(search) || m.phone.includes(search)
  );

  if(filtered.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:20px;">Members ഇല്ല. Add ചെയ്യൂ!</p>';
    return;
  }

  list.innerHTML = filtered.map((m) => {