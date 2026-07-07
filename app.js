// ===== DATABASE & CONFIG =====
let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  notices: [],
  chat: [],
  feedback: []
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

  db.members.push({ name, phone, password: pass, amount, joinDate: new Date().toISOString() });
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

  db.members.push({name, phone, password: pass, amount, joinDate: new Date().toISOString()});
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

function deleteMember(index) {
  const member = db.members[index];
  if(!member) return;

  if(confirm(`Delete ചെയ്യണോ? ${member.name} - ${member.phone}`)) {
    db.members.splice(index, 1);
    Object.keys(db.payments).forEach(month => {
      if(db.payments[month][member.phone]) delete db.payments[month][member.phone];
    });
    if(saveDB()) {
      renderAdminMembers();
      updateStats();
      alert('✅ Deleted!');
    }
  }
}

// ===== COLLECTION =====
function loadMonths() {
  const months = [];
  for(let i = 0; i < TOTAL_MONTHS; i++) {
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
  showNotification('Payment Marked', `${phone} - ₹${amount} paid`);
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

// ===== WHATSAPP REMINDER =====
function sendWhatsAppReminder() {
  const month = document.getElementById('colMonth').value;
  const payments = db.payments[month] || {};
  const pending = db.members.filter(m =>!payments[m.phone] || payments[m.phone] < m.amount);

  if(pending.length === 0) {
    alert('✅ എല്ലാവരും Paid ആണ്!');
    return;
  }

  pending.forEach(m => {
    const msg = `ഹായ് ${m.name}, Mashood Kuri ${month} മാസ അടവ് ₹${m.amount} pending ആണ്. ദയവായി അടക്കുക. - Admin`;
    const url = `https://wa.me/91${m.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  });
}

// ===== WHEEL & DRAW =====
function doRandomDraw() {
  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    return payments[m.phone] >= m.amount;
  });

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
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F8B500','#6C5CE7','#FF9FF3','#54A0FF'];
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
    playWinSound();
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
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F'];
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
  `;

  // Winner save ചെയ്യുമ്പോൾ month number add ചെയ്യുക
  const monthNum = db.winners.length + 1;
  db.winners.push({
    name: winner.name,
    phone: winner.phone,
    amount: winner.amount,
    month: currentMonth,
    monthNum: monthNum
  });
  saveDB();
  updateStats();
  renderRecentWinners();
  renderAllWinners();
  showNotification('New Winner!', `${winner.name} - Month ${monthNum}`);
}

function playWinSound() {
  const audio = document.getElementById('winSound');
  if(audio) audio.play().catch(e => console.log('Audio play failed:', e));
}

function selectManualWinner() {
  const select = document.getElementById('manualWinner');
  const member = db.members.find(m => m.phone === select.value);
  if(!member) return;

  const monthNum = db.winners.length + 1;
  db.winners.push({
    name: member.name,
    phone: member.phone,
    amount: member.amount,
    month: currentMonth,
    monthNum: monthNum
  });
  saveDB();
  updateStats();
  renderRecentWinners();
  renderAllWinners();
  alert(`✅ Winner: ${member.name}`);
}

// ===== WINNERS LIST =====
function renderRecentWinners() {
  const div = document.getElementById('recentWinners');
  if(!div) return;
  const recent = db.winners.slice(-5).reverse();
  div.innerHTML = recent.length? recent.map(w => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>🏆 ${w.name}</h4>
        <p>📱 ${w.phone} | 💰 ₹${w.amount} | 📅 Month ${w.monthNum || '?'}</p>
      </div>
    </div>
  `).join('') : '<p>ഇതുവരെ Winners ഇല്ല</p>';
}

function renderAllWinners() {
  const div = document.getElementById('allWinnersList');
  if(!div) return;

  if(db.winners.length === 0) {
    div.innerHTML = '<p>ഇതുവരെ Winners ഇല്ല</p>';
    return;
  }

  div.innerHTML = db.winners.map((w, i) => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>Month ${i + 1}: 🏆 ${w.name}</h4>
        <p>📱 ${w.phone} | 💰 ₹${w.amount} | 📅 ${w.month}</p>
      </div>
    </div>
  `).join('');
}

function renderMemberWinners() {
  const div = document.getElementById('memberWinnersList');
  if(!div) return;

  if(db.winners.length === 0) {
    div.innerHTML = '<p>ഇതുവരെ Winners ഇല്ല</p>';
    return;
  }

  div.innerHTML = db.winners.map((w, i) => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>Month ${i + 1}: 🏆 ${w.name}</h4>
        <p>💰 ₹${w.amount} | 📅 ${w.month}</p>
      </div>
    </div>
  `).join('');
}

// ===== REPORTS =====
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
          <thead><tr style="background:var(--bg);"><th style="padding:10px;text-align:left;">Name</th><th style="padding:10px;">Phone</th><th style="padding:10px;">Amount</th><th style="padding:10px;">Paid</th><th style="padding:10px;">Status</th></tr></thead>
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

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const month = document.getElementById('reportMonth').value;
  const payments = db.payments[month] || {};

  doc.setFontSize(18);
  doc.text('Mashood Kuri Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Month: ${month}`, 105, 30, { align: 'center' });

  let y = 45;
  doc.text('Name', 20, y);
  doc.text('Phone', 70, y);
  doc.text('Amount', 120, y);
  doc.text('Paid', 150, y);
  doc.text('Status', 180, y);
  y += 10;

  db.members.forEach(m => {
    const paidAmt = payments[m.phone] || 0;
    const status = paidAmt >= m.amount? 'Paid' : 'Pending';
    doc.text(m.name.substring(0, 20), 20, y);
    doc.text(m.phone, 70, y);
    doc.text(`Rs.${m.amount}`, 120, y);
    doc.text(`Rs.${paidAmt}`, 150, y);
    doc.text(status, 180, y);
    y += 10;
    if(y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(`Mashood-Kuri-${month}.pdf`);
}

// ===== RECEIPT =====
function downloadReceipt() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Mashood Kuri - Payment Receipt', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Name: ${currentUser.name}`, 20, 40);
  doc.text(`Phone: ${currentUser.phone}`, 20, 50);
  doc.text(`Monthly Amount: Rs.${currentUser.amount}`, 20, 60);
  doc.text(`Month: ${currentMonth}`, 20, 70);

  const payments = db.payments[currentMonth] || {};
  const paid = payments[currentUser.phone] || 0;
  doc.text(`Status: ${paid >= currentUser.amount? 'PAID' : 'PENDING'}`, 20, 80);
  doc.text(`Amount Paid: Rs.${paid}`, 20, 90);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 100);

  doc.save(`Receipt-${currentUser.phone}-${currentMonth}.pdf`);
}

// ===== CHAT =====
function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if(!msg) return;

  db.chat.push({
    sender: 'Admin',
    msg: msg,
    time: new Date().toLocaleString()
  });
  saveDB();
  input.value = '';
  renderChat();
}

function memberSendChat() {
  const input = document.getElementById('memberChatInput');
  const msg = input.value.trim();
  if(!msg) return;

  db.chat.push({
    sender: currentUser.name,
    msg: msg,
    time: new Date().toLocaleString()
  });
  saveDB();
  input.value = '';
  renderMemberChat();
}

function renderChat() {
  const div = document.getElementById('chatMessages');
  if(!div) return;
  div.innerHTML = db.chat.map(c => `
    <div class="chat-message ${c.sender === 'Admin'? 'sent' : 'received'}">
      <strong>${c.sender}</strong>
      <p>${c.msg}</p>
      <div class="time">${c.time}</div>
    </div>
  `).join('');
  div.scrollTop = div.scrollHeight;
}

function renderMemberChat() {
  const div = document.getElementById('memberChatBox');
  if(!div) return;
  div.innerHTML = db.chat.map(c => `
    <div class="chat-message ${c.sender === currentUser.name? 'sent' : 'received'}">
      <strong>${c.sender}</strong>
      <p>${c.msg}</p>
      <div class="time">${c.time}</div>
    </div>
  `).join('');
  div.scrollTop = div.scrollHeight;
}

// ===== FEEDBACK =====
function submitFeedback() {
  const text = document.getElementById('feedbackText').value.trim();
  if(!text) {
    alert('❌ Feedback എഴുതൂ!');
    return;
  }

  db.feedback.push({
    name: currentUser.name,
    phone: currentUser.phone,
    msg: text,
    time: new Date().toLocaleString()
  });
  saveDB();
  document.getElementById('feedbackText').value = '';
  alert('✅ Feedback submitted!');
  showNotification('New Feedback', `From ${currentUser.name}`);
}

function renderFeedback() {
  const div = document.getElementById('feedbackList');
  if(!div) return;
  if(db.feedback.length === 0) {
    div.innerHTML = '<p>No feedback yet</p>';
    return;
  }
  div.innerHTML = db.feedback.map(f => `
    <div class="member-item">
      <div class="member-item-info">
        <h4>${f.name} (${f.phone})</h4>
        <p>${f.msg}</p>
        <small>${f.time}</small>
      </div>
    </div>
  `).join('');
}

// ===== BACKUP & RESTORE =====
function backupData() {
  const data = JSON.stringify(db, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MashoodKuri-Backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  alert('✅ Backup Downloaded!');
}

function restoreData(event) {
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const restored = JSON.parse(e.target.result);
      if(confirm('⚠️ ഇപ്പോഴത്തെ data മുഴുവൻ മാറും. Restore ചെയ്യണോ?')) {
        db = restored;
        saveDB();
        alert('✅ Data Restored! Page reload ചെയ്യുന്നു...');
        location.reload();
      }
    } catch(err) {
      alert('❌ Invalid backup file!');
    }
  };
  reader.readAsText(file);
}

// ===== NOTIFICATIONS =====
function requestNotification() {
  if(!('Notification' in window)) {
    alert('❌ Browser notifications not supported');
    return;
  }
  Notification.requestPermission().then(perm => {
    if(perm === 'granted') {
      new Notification('Mashood Kuri', { body: 'Notifications enabled!', icon: 'logo.png' });
    }
  });
}

function showNotification(title, body) {
  if('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'logo.png' });
  }
}