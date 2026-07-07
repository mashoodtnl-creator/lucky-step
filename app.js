// MASHOOD KURI - NO SPLASH VERSION
let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  excludedWinners: []
};

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentMonth = new Date().toISOString().slice(0,7);
const TOTAL_MONTHS = 25;

// START - NO SPLASH
window.onload = function() {
  console.log('App Loaded');
  if(currentUser === 'admin') {
    showAdminPage();
  } else if(currentUser && currentUser.phone) {
    memberAutoLogin();
  }
};

function saveDB() {
  localStorage.setItem('mashoodKuriDB', JSON.stringify(db));
}

function adminLoginDirect() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('adminLoginBox').classList.remove('hidden');
}

function showMemberLogin() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('memberLoginBox').classList.remove('hidden');
}

function backToLogin() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('loginPage').classList.remove('hidden');
}

function showRegister() {
  if(db.members.length >= TOTAL_MONTHS) {
    alert('Maximum ' + TOTAL_MONTHS + ' members only!');
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
    alert('തെറ്റായ Password!');
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
    alert('തെറ്റായ Login വിവരങ്ങൾ');
  }
}

function memberRegister() {
  if(!document.getElementById('termsCheck').checked) {
    alert('Terms & Conditions അംഗീകരിക്കണം!');
    return;
  }
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPass').value;
  const amount = parseInt(document.getElementById('regAmount').value);

  if(!name ||!phone ||!pass ||!amount){
    alert('എല്ലാ വിവരങ്ങളും നൽകുക');
    return;
  }
  if(db.members.some(m => m.phone === phone)) {
    alert('ഈ Phone Number already registered!');
    return;
  }

  db.members.push({name,phone,password:pass,amount,active:true});
  saveDB();
  alert('Registration Successful');
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
  document.getElementById('memPaymentStatus').innerHTML = paid >= currentUser.amount?
    `<p style="color:green;">✅ ${currentMonth} - Paid ₹${paid}</p>` :
    `<p style="color:orange;">⏳ ${currentMonth} - Pending ₹${paid}/${currentUser.amount}</p>`;

  let paidCount = 0;
  Object.values(db.payments).forEach(mp => {
    if(mp[currentUser.phone] >= currentUser.amount) paidCount++;
  });
  document.getElementById('paidMonths').textContent = paidCount;
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  location.reload();
}

function showAdminPage() {
  document.querySelectorAll('.login-box, #loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('adminPage').classList.remove('hidden');
  updateStats();
  renderAdminMembers();
  loadMonths();
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
  document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  if(event) event.target.closest('a').classList.add('active');
  if(window.innerWidth < 768) toggleSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function updateStats() {
  document.getElementById('totalMembers').textContent = db.members.length;
  const payments = db.payments[currentMonth] || {};
  document.getElementById('paidMembers').textContent = Object.keys(payments).length;
  document.getElementById('pendingMembers').textContent = db.members.length - Object.keys(payments).length;
  const total = Object.values(payments).reduce((sum, amt) => sum + amt, 0);
  document.getElementById('totalCollection').textContent = '₹' + total;
}

function addMemberByAdmin() {
  const name = document.getElementById('newMemName').value.trim();
  const phone = document.getElementById('newMemPhone').value.trim();
  const pass = document.getElementById('newMemPass').value;
  const amount = parseInt(document.getElementById('newMemAmount').value);

  if(!name ||!phone ||!pass ||!amount) {
    alert('എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }

  db.members.push({name,phone,password:pass,amount,active:true});
  saveDB();
  renderAdminMembers();
  updateStats();
  document.getElementById('newMemName').value = '';
  document.getElementById('newMemPhone').value = '';
  document.getElementById('newMemPass').value = '';
  document.getElementById('newMemAmount').value = '';
  alert('Member Added!');
}

function renderAdminMembers() {
  const list = document.getElementById('adminMembersList');
  if(!list) return;
  if(db.members.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:20px;">Members ഇല്ല</p>';
    return;
  }
  list.innerHTML = db.members.map((m, i) => {
    const isActive = m.active!== false;
    return `
      <div class="member-item">
        <div class="member-item-info">
          <h4>${m.name} ${!isActive? '<span style="color:red; font-size:12px;">(Hidden)</span>' : ''}</h4>
          <p>📱 ${m.phone} | 💰 ₹${m.amount}/month</p>
        </div>
        <div class="member-actions">
          <button class="small ${isActive? 'secondary' : 'success'}" onclick="toggleMemberStatus(${i})">
            ${isActive? 'Hide' : 'Show'}
          </button>
          <button class="small danger" onclick="deleteMember(${i})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleMemberStatus(index) {
  if(db.members[index].active === undefined) db.members[index].active = true;
  db.members[index].active =!db.members[index].active;
  saveDB();
  renderAdminMembers();
}

function deleteMember(index) {
  if(confirm('Delete ചെയ്യണോ?')) {
    db.members.splice(index, 1);
    saveDB();
    renderAdminMembers();
    updateStats();
  }
}

function loadMonths() {
  const months = [];
  for(let i = 0; i < TOTAL_MONTHS; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0,7));
  }
  const colMonth = document.getElementById('colMonth');
  if(colMonth) {
    colMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
    renderCollection();
  }
}

function renderCollection() {
  const month = document.getElementById('colMonth')?.value || currentMonth;
  const payments = db.payments[month] || {};
  const list = document.getElementById('collectionList');
  if(!list) return;

  list.innerHTML = db.members.map(m => {
    const paid = payments[m.phone] || 0;
    const isPaid = paid >= m.amount;
    return `
      <div class="member-item">
        <div class="member-item-info">
          <h4>${m.name}</h4>
          <p>💰 ₹${paid}/${m.amount} ${isPaid? '✅' : '⏳'}</p>
        </div>
        <div class="member-actions">
          ${!isPaid? `<button class="small" onclick="markPaid('${m.phone}', ${m.amount})">Mark Paid</button>` : '<span style="color:green;">Paid</span>'}
        </div>
      </div>
    `;
  }).join('');
}

function markPaid(phone, amount) {
  const month = document.getElementById('colMonth').value;
  if(!db.payments[month]) db.payments[month] = {};
  db.payments[month][phone] = amount;
  saveDB();
  renderCollection();
  updateStats();
}

function markAllPaid() {
  const month = document.getElementById('colMonth').value;
  if(!db.payments[month]) db.payments[month] = {};
  db.members.forEach(m => {
    db.payments[month][m.phone] = m.amount;
  });
  saveDB();
  renderCollection();
  updateStats();
  alert('എല്ലാവരും Paid ആയി!');
}

function doRandomDraw() {
  const winnerPhones = db.winners.map(w => w.phone);
  if(!db.excludedWinners) db.excludedWinners = [];

  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount && m.active!== false &&!winnerPhones.includes(m.phone) &&!db.excludedWinners.includes(m.phone);
  });

  if(eligible.length === 0) {
    alert('Eligible Members ഇല്ല!');
    return;
  }

  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  const monthNum = db.winners.length + 1;

  document.getElementById('winnerDisplay').innerHTML = `
    <div class="card" style="background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white; text-align: center; padding: 40px; margin-top: 20px;">
      <h2 style="font-size: 40px;">🎉 WINNER 🎉</h2>
      <h1 style="font-size: 50px; margin: 20px 0;">${winner.name}</h1>
      <p style="font-size: 24px;">📱 ${winner.phone}</p>
      <p style="font-size: 28px; margin-top: 20px; font-weight: bold;">💰 ₹${winner.amount}</p>
    </div>
  `;

  db.winners.push({
    name: winner.name,
    phone: winner.phone,
    amount: winner.amount,
    month: currentMonth,
    monthNum: monthNum
  });
  saveDB();
  updateStats();
  renderAllWinners();
}

function renderAllWinners() {
  const div = document.getElementById('allWinnersList');
  if(!div) return;
  if(db.winners.length === 0) {
    div.innerHTML = '<p>ഇതുവരെ Winners ഇല്ല</p>';
    return;
  }
  if(!db.excludedWinners) db.excludedWinners = [];
  div.innerHTML = db.winners.map((w, i) => {
    const isExcluded = db.excludedWinners.includes(w.phone);
    return `
      <div class="member-item">
        <div class="member-item-info">
          <h4>Month ${i + 1}: 🏆 ${w.name} ${isExcluded? '<span style="color:red; font-size:12px;">(Excluded)</span>' : ''}</h4>
          <p>📱 ${w.phone} | 💰 ₹${w.amount}</p>
        </div>
        <div class="member-actions">
          <button class="small ${isExcluded? 'success' : 'secondary'}" onclick="toggleWinnerExclude('${w.phone}')">
            ${isExcluded? 'Include' : 'Exclude'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleWinnerExclude(phone) {
  if(!db.excludedWinners) db.excludedWinners = [];
  const index = db.excludedWinners.indexOf(phone);
  if(index === -1) {
    db.excludedWinners.push(phone);
  } else {
    db.excludedWinners.splice(index, 1);
  }
  saveDB();
  renderAllWinners();
}

function clearAllWinners() {
  if(confirm('All Winners Clear ചെയ്യണോ?')) {
    db.winners = [];
    db.excludedWinners = [];
    saveDB();
    renderAllWinners();
    updateStats();
    alert('All Winners Cleared!');
  }
}

function downloadReceipt() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Mashood Kuri - Receipt', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Name: ${currentUser.name}`, 20, 40);
  doc.text(`Phone: ${currentUser.phone}`, 20, 50);
  doc.text(`Amount: Rs.${currentUser.amount}`, 20, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
  doc.save(`Receipt-${currentUser.phone}.pdf`);
}