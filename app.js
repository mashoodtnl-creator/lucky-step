// DB Load - Error handling കൂടി
let db;
try {
  db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
    admin: { password: 'mashood123' },
    members: [],
    payments: {},
    winners: [],
    notices: []
  };
} catch(e) {
  console.error('DB Load Error:', e);
  db = { admin: { password: 'mashood123' }, members: [], payments: {}, winners: [], notices: [] };
}

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentMonth = new Date().toISOString().slice(0,7);
let wheelSpinning = false;

function saveDB() {
  try {
    localStorage.setItem('mashoodKuriDB', JSON.stringify(db));
    console.log('✅ Saved. Total members:', db.members.length);
    return true;
  } catch(e) {
    alert('❌ Save Failed! Storage full ആയിരിക്കും. Browser cache clear ചെയ്യൂ.');
    console.error('Save Error:', e);
    return false;
  }
}

// Splash + Auto Login
setTimeout(() => {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';

  // Auto login
  if(currentUser === 'admin') {
    showAdminPage();
  } else if(currentUser && currentUser.phone) {
    memberAutoLogin();
  }
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
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
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
  renderRecentWinners();
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

function renderRecentWinners() {
  const div = document.getElementById('recentWinners');
  if(!div) return;
  const recent = db.winners.slice(-5).reverse();
  div.innerHTML = recent.length? recent.map(w => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>🏆 ${w.name}</h4>
        <p>📱 ${w.phone} | 💰 ₹${w.amount} | 📅 ${w.month}</p>
      </div>
    </div>
  `).join('') : '<p>ഇതുവരെ Winners ഇല്ല</p>';
}

// FIX 1: MEMBER ADD - WORKING VERSION
function addMemberByAdmin() {
  const name = document.getElementById('newMemName').value.trim();
  const phone = document.getElementById('newMemPhone').value.trim();
  const pass = document.getElementById('newMemPass').value.trim();
  const amount = parseInt(document.getElementById('newMemAmount').value);

  if(!name ||!phone ||!pass ||!amount) {
    alert('❌ എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }

  if(db.members.some(m => m.phone === phone)) {
    alert('❌ ഈ Phone Number already ഉണ്ട്!');
    return;
  }

  const newMember = {
    name: name,
    phone: phone,
    password: pass,
    amount: amount,
    joinDate: new Date().toISOString()
  };

  db.members.push(newMember);

  if(saveDB()) {
    renderAdminMembers();
    updateStats();
    document.getElementById('newMemName').value = '';
    document.getElementById('newMemPhone').value = '';
    document.getElementById('newMemPass').value = '';
    document.getElementById('newMemAmount').value = '';
    alert('✅ Member Added! Total: ' + db.members.length);
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
    const realIndex = db.members.findIndex(mem => mem.phone === m.phone);
    return `
      <div class="member-item">
        <div class="member-item-info">
          <h4>${m.name}</h4>
          <p>📱 ${m.phone} | 💰 ₹${m.amount}/month</p>
        </div>
        <div class="member-actions">
          <button class="small danger" onclick="deleteMember(${realIndex})"><i class="ri-delete-bin-line"></i> Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// FIX 2: DELETE WORKING VERSION
function deleteMember(index) {
  const member = db.members[index];
  if(!member) {
    alert('❌ Member not found!');
    return;
  }

  if(confirm(`Delete ചെയ്യണോ? ${member.name} - ${member.phone}`)) {
    db.members.splice(index, 1);

    // Payment-ഉം delete ചെയ്യുക
    Object.keys(db.payments).forEach(month => {
      if(db.payments[month][member.phone]) {
        delete db.payments[month][member.phone];
      }
    });

    if(saveDB()) {
      renderAdminMembers();
      updateStats();
      alert('✅ Deleted!');
    }
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

  if(db.members.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:20px;">Members ഇല്ല. ആദ്യം Add ചെയ്യൂ!</p>';
    return;
  }

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
  alert('✅ എല്ലാവരും Paid ആയി Mark ചെയ്തു!');
}

// FIX 3: WHEEL - ALL PAID MEMBERS WILL SHOW
function doRandomDraw() {
  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount;
  });

  console.log('Total Members:', db.members.length);
  console.log('Eligible for wheel:', eligible);

  if(eligible.length === 0) {
    alert('❌ Paid Members ഇല്ല! Collection-ൽ പോയി Mark Paid ചെയ്യൂ');
    return;
  }

  document.getElementById('winnerDisplay').innerHTML = '';
  document.getElementById('wheelContainer').style.display = 'block';
  drawWheel(eligible);
}

function drawWheel(members) {
  const canvas = document.getElementById('wheelCanvas');
  if(!canvas) {
    alert('❌ Wheel canvas not found! index.html check ചെയ്യൂ');
    return;
  }
  const ctx = canvas.getContext('2d');
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F8B500','#6C5CE7'];
  const arc = Math.PI * 2 / members.length;

  ctx.clearRect(0, 0, 300, 300);

  members.forEach((m, i) => {
    const angle = i * arc;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(150, 150, 140, angle, angle + arc);
    ctx.lineTo(150, 150);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.translate(150 + Math.cos(angle + arc / 2) * 100, 150 + Math.sin(angle + arc / 2) * 100);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    const text = m.name.length > 12? m.name.substring(0, 12) : m.name;
    ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(150, 150, 25, 0, 2 * Math.PI);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('SPIN', 150 - 18, 150 + 5);
}

function spinWheelNow() {
  if(wheelSpinning) return;
  wheelSpinning = true;

  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount;
  });

  const canvas = document.getElementById('wheelCanvas');
  const winnerIndex = Math.floor(Math.random() * eligible.length);
  const arc = 360 / eligible.length;
  const stopAngle = 3600 + (360 - (winnerIndex * arc + arc/2));

  canvas.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  canvas.style.transform = `rotate(${stopAngle}deg)`;

  setTimeout(() => {
    const winner = eligible[winnerIndex];
    showWinnerCard(winner);
    wheelSpinning = false;
    canvas.style.transition = 'none';
    setTimeout(() => {
      canvas.style.transform = 'rotate(0deg)';
      document.getElementById('wheelContainer').style.display = 'none';
    }, 100);
  }, 5000);
}

function showWinnerCard(winner) {
  const display = document.getElementById('winnerDisplay');
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A'];
  const color1 = colors[Math.floor(Math.random()*colors.length)];
  const color2 = colors[Math.floor(Math.random()*colors.length)];

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
  renderRecentWinners();
}

function selectManualWinner() {
  const select = document.getElementById('manualWinner');
  const member = db.members.find(m => m.phone === select.value);
  if(!member) return;
  db.winners.push({name: member.name, phone: member.phone, amount: member.amount, month: currentMonth});
  saveDB();
  updateStats();
  renderRecentWinners();
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
  if(db.members.some(m => m.phone === phone)) {
    alert('❌ ഈ Phone Number already registered!');
    return;
  }
  db.members.push({ name, phone, password: pass, amount: parseInt(amount) });
  saveDB();
  alert('Registration Successful');
  backToLogin();
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
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  location.reload();
}