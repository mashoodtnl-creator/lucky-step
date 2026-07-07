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

// Splash Screen
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

function showRegister() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('registerBox').classList.remove('hidden');
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
  updateStats();
  renderAdminMembers();
  renderCollection();
  renderReport();
  loadMonths();
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
  document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  event.target.closest('a').classList.add('active');
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

function addMemberByAdmin() {
  const name = document.getElementById('newMemName').value;
  const phone = document.getElementById('newMemPhone').value;
  const pass = document.getElementById('newMemPass').value;
  const amount = document.getElementById('newMemAmount').value;
  if(!name ||!phone ||!pass ||!amount) {
    alert('❌ എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }
  db.members.push({name, phone, password: pass, amount: parseInt(amount), joinDate: new Date().toISOString()});
  saveDB();
  renderAdminMembers();
  updateStats();
  document.getElementById('newMemName').value = '';
  document.getElementById('newMemPhone').value = '';
  document.getElementById('newMemPass').value = '';
  document.getElementById('newMemAmount').value = '';
  alert('✅ Member Added!');
}

function renderAdminMembers() {
  const search = document.getElementById('searchMember')?.value.toLowerCase() || '';
  const list = document.getElementById('adminMembersList');
  if(!list) return;
  const filtered = db.members.filter(m => m.name.toLowerCase().includes(search) || m.phone.includes(search));
  list.innerHTML = filtered.map((m, i) => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>${m.name}</h4>
        <p>📱 ${m.phone} | 💰 ₹${m.amount}/month</p>
      </div>
      <div class="member-actions">
        <button class="small danger" onclick="deleteMember(${i})"><i class="ri-delete-bin-line"></i></button>
      </div>
    </div>
  `).join('');
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
  for(let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0,7));
  }
  const colMonth = document.getElementById('colMonth');
  const reportMonth = document.getElementById('reportMonth');
  if(colMonth) colMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
  if(reportMonth) reportMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
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
          ${!isPaid? `<button class="small" onclick="markPaid('${m.phone}', ${m.amount})">Mark Paid</button>` : ''}
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
  alert('✅ എല്ലാവരും Paid ആയി Mark ചെയ്തു!');
}

function doRandomDraw() {
  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount;
  });
  if(eligible.length === 0) {
    alert('❌ Paid Members ഇല്ല! ആദ്യം Collection-ൽ പോയി Mark Paid ചെയ്യൂ');
    return;
  }
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F8B500','#6C5CE7','#FF9FF3','#54A0FF'];
  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  const color1 = colors[Math.floor(Math.random()*colors.length)];
  const color2 = colors[Math.floor(Math.random()*colors.length)];
  const display = document.getElementById('winnerDisplay');
  display.innerHTML = `
    <div class="card" style="background: linear-gradient(135deg, ${color1}, ${color2}); color: white; text-align: center; padding: 40px; margin-top: 20px; animation: winnerPop 0.5s;">
      <h2 style="font-size: 40px; margin-bottom: 20px;">🎉 WINNER 🎉</h2>
      <h1 style="font-size: 50px; margin: 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${winner.name}</h1>
      <p style="font-size: 24px;">📱 ${winner.phone}</p>
      <p style="font-size: 28px; margin-top: 20px; font-weight: bold;">💰 ₹${winner.amount}</p>
      <p style="margin-top: 30px; font-size: 18px;">${currentMonth}</p>
    </div>
    <style>
      @keyframes winnerPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  db.winners.push({name: winner.name, phone: winner.phone, amount: winner.amount, month: currentMonth});
  saveDB();
  updateStats();
}

function selectManualWinner() {
  const select = document.getElementById('manualWinner');
  const member = db.members.find(m => m.phone === select.value);
  if(!member) return;
  db.winners.push({name: member.name, phone: member.phone, amount: member.amount, month: currentMonth});
  saveDB();
  updateStats();
  alert(`✅ Winner: ${member.name}`);
}

function renderReport() {
  const month = document.getElementById('reportMonth')?.value || currentMonth;
  const payments = db.payments[month] || {};
  const paid = Object.keys(payments).length;
  const total = Object.values(payments).reduce((sum, amt) => sum + amt, 0);
  const reportSummary = document.getElementById('reportSummary');
  if(reportSummary) {
    reportSummary.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><i class="ri-group-fill"></i><div><h2>${db.members.length}</h2><p>Total Members</p></div></div>
        <div class="stat-card"><i class="ri-checkbox-circle-fill"></i><div><h2>${paid}</h2><p>Paid</p></div></div>
        <div class="stat-card"><i class="ri-money-rupee-circle-fill"></i><div><h2>₹${total}</h2><p>Collection</p></div></div>
      </div>
    `;
  }
  const table = db.members.map(m => {
    const paidAmt = payments[m.phone] || 0;
    const status = paidAmt >= m.amount? '✅ Paid' : '⏳ Pending';
    return `<tr><td>${m.name}</td><td>${m.phone}</td><td>₹${m.amount}</td><td>₹${paidAmt}</td><td>${status}</td></tr>`;
  }).join('');
  const reportTable = document.getElementById('reportTable');
  if(reportTable) {
    reportTable.innerHTML = `
      <div class="card">
        <table style="width:100%; border-collapse: collapse;">
          <thead><tr style="background:#f0f0f0;"><th style="padding:10px;text-align:left;">Name</th><th style="padding:10px;">Phone</th><th style="padding:10px;">Amount</th><th style="padding:10px;">Paid</th><th style="padding:10px;">Status</th></tr></thead>
          <tbody>${table}</tbody>
        </table>
      </div>
    `;
  }
}

function exportCSV() {
  const month = document.getElementById('reportMonth').value;
  const payments = db.payments[month] || {};
  let csv = 'Name,Phone,Amount,Paid,Status\n';
  db.members.forEach(m => {
    const paidAmt = payments[m.phone] || 0;
    const status = paidAmt >= m.amount? 'Paid' : 'Pending';
    csv += `${m.name},${m.phone},${m.amount},${paidAmt},${status}\n`;
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mashood-Kuri-${month}.csv`;
  a.click();
  alert('✅ CSV File Download ആയി!');
}

function addNotice() {
  const title = document.getElementById('noticeTitle').value;
  const msg = document.getElementById('noticeMsg').value;
  if(!title ||!msg) {
    alert('❌ Title & Message Fill ചെയ്യൂ!');
    return;
  }
  db.notices.push({title, msg, date: new Date().toLocaleString()});
  saveDB();
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeMsg').value = '';
  alert('✅ Notice Added!');
}

function memberRegister() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const pass = document.getElementById('regPass').value;
  const amount = document.getElementById('regAmount').value;
  if(!name ||!phone ||!pass ||!amount){
    alert('എല്ലാ വിവരങ്ങളും നൽകുക');
    return;
  }
  db.members.push({
    name,
    phone,
    password: pass,
    amount: parseInt(amount)
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

function logout() {
  currentUser = null;
  location.reload();
}let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
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

// Splash Screen
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

function showRegister() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('registerBox').classList.remove('hidden');
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
  updateStats();
  renderAdminMembers();
  renderCollection();
  renderReport();
  loadMonths();
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
  document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  event.target.closest('a').classList.add('active');
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

function addMemberByAdmin() {
  const name = document.getElementById('newMemName').value;
  const phone = document.getElementById('newMemPhone').value;
  const pass = document.getElementById('newMemPass').value;
  const amount = document.getElementById('newMemAmount').value;
  if(!name ||!phone ||!pass ||!amount) {
    alert('❌ എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }
  db.members.push({name, phone, password: pass, amount: parseInt(amount), joinDate: new Date().toISOString()});
  saveDB();
  renderAdminMembers();
  updateStats();
  document.getElementById('newMemName').value = '';
  document.getElementById('newMemPhone').value = '';
  document.getElementById('newMemPass').value = '';
  document.getElementById('newMemAmount').value = '';
  alert('✅ Member Added!');
}

function renderAdminMembers() {
  const search = document.getElementById('searchMember')?.value.toLowerCase() || '';
  const list = document.getElementById('adminMembersList');
  if(!list) return;
  const filtered = db.members.filter(m => m.name.toLowerCase().includes(search) || m.phone.includes(search));
  list.innerHTML = filtered.map((m, i) => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>${m.name}</h4>
        <p>📱 ${m.phone} | 💰 ₹${m.amount}/month</p>
      </div>
      <div class="member-actions">
        <button class="small danger" onclick="deleteMember(${i})"><i class="ri-delete-bin-line"></i></button>
      </div>
    </div>
  `).join('');
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
  for(let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0,7));
  }
  const colMonth = document.getElementById('colMonth');
  const reportMonth = document.getElementById('reportMonth');
  if(colMonth) colMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
  if(reportMonth) reportMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
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
          ${!isPaid? `<button class="small" onclick="markPaid('${m.phone}', ${m.amount})">Mark Paid</button>` : ''}
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
  alert('✅ എല്ലാവരും Paid ആയി Mark ചെയ്തു!');
}

function doRandomDraw() {
  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount;
  });
  if(eligible.length === 0) {
    alert('❌ Paid Members ഇല്ല! ആദ്യം Collection-ൽ പോയി Mark Paid ചെയ്യൂ');
    return;
  }
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F8B500','#6C5CE7','#FF9FF3','#54A0FF'];
  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  const color1 = colors[Math.floor(Math.random()*colors.length)];
  const color2 = colors[Math.floor(Math.random()*colors.length)];
  const display = document.getElementById('winnerDisplay');
  display.innerHTML = `
    <div class="card" style="background: linear-gradient(135deg, ${color1}, ${color2}); color: white; text-align: center; padding: 40px; margin-top: 20px; animation: winnerPop 0.5s;">
      <h2 style="font-size: 40px; margin-bottom: 20px;">🎉 WINNER 🎉</h2>
      <h1 style="font-size: 50px; margin: 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${winner.name}</h1>
      <p style="font-size: 24px;">📱 ${winner.phone}</p>
      <p style="font-size: 28px; margin-top: 20px; font-weight: bold;">💰 ₹${winner.amount}</p>
      <p style="margin-top: 30px; font-size: 18px;">${currentMonth}</p>
    </div>
    <style>
      @keyframes winnerPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  db.winners.push({name: winner.name, phone: winner.phone, amount: winner.amount, month: currentMonth});
  saveDB();
  updateStats();
}

function selectManualWinner() {
  const select = document.getElementById('manualWinner');
  const member = db.members.find(m => m.phone === select.value);
  if(!member) return;
  db.winners.push({name: member.name, phone: member.phone, amount: member.amount, month: currentMonth});
  saveDB();
  updateStats();
  alert(`✅ Winner: ${member.name}`);
}

function renderReport() {
  const month = document.getElementById('reportMonth')?.value || currentMonth;
  const payments = db.payments[month] || {};
  const paid = Object.keys(payments).length;
  const total = Object.values(payments).reduce((sum, amt) => sum + amt, 0);
  const reportSummary = document.getElementById('reportSummary');
  if(reportSummary) {
    reportSummary.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><i class="ri-group-fill"></i><div><h2>${db.members.length}</h2><p>Total Members</p></div></div>
        <div class="stat-card"><i class="ri-checkbox-circle-fill"></i><div><h2>${paid}</h2><p>Paid</p></div></div>
        <div class="stat-card"><i class="ri-money-rupee-circle-fill"></i><div><h2>₹${total}</h2><p>Collection</p></div></div>
      </div>
    `;
  }
  const table = db.members.map(m => {
    const paidAmt = payments[m.phone] || 0;
    const status = paidAmt >= m.amount? '✅ Paid' : '⏳ Pending';
    return `<tr><td>${m.name}</td><td>${m.phone}</td><td>₹${m.amount}</td><td>₹${paidAmt}</td><td>${status}</td></tr>`;
  }).join('');
  const reportTable = document.getElementById('reportTable');
  if(reportTable) {
    reportTable.innerHTML = `
      <div class="card">
        <table style="width:100%; border-collapse: collapse;">
          <thead><tr style="background:#f0f0f0;"><th style="padding:10px;text-align:left;">Name</th><th style="padding:10px;">Phone</th><th style="padding:10px;">Amount</th><th style="padding:10px;">Paid</th><th style="padding:10px;">Status</th></tr></thead>
          <tbody>${table}</tbody>
        </table>
      </div>
    `;
  }
}

function exportCSV() {
  const month = document.getElementById('reportMonth').value;
  const payments = db.payments[month] || {};
  let csv = 'Name,Phone,Amount,Paid,Status\n';
  db.members.forEach(m => {
    const paidAmt = payments[m.phone] || 0;
    const status = paidAmt >= m.amount? 'Paid' : 'Pending';
    csv += `${m.name},${m.phone},${m.amount},${paidAmt},${status}\n`;
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mashood-Kuri-${month}.csv`;
  a.click();
  alert('✅ CSV File Download ആയി!');
}

function addNotice() {
  const title = document.getElementById('noticeTitle').value;
  const msg = document.getElementById('noticeMsg').value;
  if(!title ||!msg) {
    alert('❌ Title & Message Fill ചെയ്യൂ!');
    return;
  }
  db.notices.push({title, msg, date: new Date().toLocaleString()});
  saveDB();
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeMsg').value = '';
  alert('✅ Notice Added!');
}

function memberRegister() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const pass = document.getElementById('regPass').value;
  const amount = document.getElementById('regAmount').value;
  if(!name ||!phone ||!pass ||!amount){
    alert('എല്ലാ വിവരങ്ങളും നൽകുക');
    return;
  }
  db.members.push({
    name,
    phone,
    password: pass,
    amount: parseInt(amount)
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

function logout() {
  currentUser = null;
  location.reload();
}