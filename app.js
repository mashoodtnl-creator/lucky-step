let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  notices: []
};

let currentUser = null;
let currentMonth = new Date().toISOString().slice(0,7);

function saveDB() {
  localStorage.setItem('mashoodKuriDB', JSON.stringify(db));
}

// Splash Screen - ഇതാണ് Login Page കാണിക്കേണ്ട Code
setTimeout(() => {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
}, 3000);

function showLogin(type) {
  document.getElementById('loginPage').classList.add('hidden');
  if(type === 'admin') document.getElementById('adminLoginBox').classList.remove('hidden');
  else document.getElementById('memberLoginBox').classList.remove('hidden');
}

function backToLogin() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('loginPage').classList.remove('hidden');
}

function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  if(pass === db.admin.password) {
    currentUser = 'admin';
    showAdminPage();
  } else {
    alert('❌ തെറ്റായ Password!');
  }
}

function showAdminPage() {
  document.querySelectorAll('.login-box, #loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('adminPage').classList.remove('hidden');
}

function logout() {
  currentUser = null;
  location.reload();
}