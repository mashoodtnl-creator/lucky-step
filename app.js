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
}function showRegister() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('registerBox').classList.remove('hidden');
}

function memberRegister() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const pass = document.getElementById('regPass').value;
  const amount = document.getElementById('regAmount').value;

  if(!name || !phone || !pass || !amount){
    alert('എല്ലാ വിവരങ്ങളും നൽകുക');
    return;
  }

  db.members.push({
    name,
    phone,
    password: pass,
    amount
  });

  saveDB();
  alert('Registration Successful');
  backToLogin();
}

function memberLogin() {
  const phone = document.getElementById('memberPhone').value;
  const pass = document.getElementById('memberPass').value;

  const member = db.members.find(
    m => m.phone === phone && m.password === pass
  );

  if(member){
    currentUser = member;

    document.querySelectorAll('.login-box,#loginPage').forEach(
      el => el.classList.add('hidden')
    );

    document.getElementById('memberPage').classList.remove('hidden');

    document.getElementById('memberNameNav').textContent = member.name;
    document.getElementById('memName').textContent = member.name;
    document.getElementById('memPhone').textContent = member.phone;
    document.getElementById('memAmount').textContent = "₹" + member.amount;
  } else {
    alert('തെറ്റായ Login വിവരങ്ങൾ');
  }
}