// MASHOOD KURI - WORKING VERSION
let db = JSON.parse(localStorage.getItem('mashoodKuriDB')) || {
  admin: { password: 'mashood123' },
  members: [],
  payments: {},
  winners: [],
  chat: [],
  feedback: [],
  excludedWinners: []
};

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentMonth = new Date().toISOString().slice(0,7);
let currentLang = 'ml';
let wheelSpinning = false;
const TOTAL_MONTHS = 25;

// START APP
window.addEventListener('DOMContentLoaded', function() {
  console.log('App Starting...');

  setTimeout(function() {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';

    if(currentUser === 'admin') {
      showAdminPage();
    } else if(currentUser && currentUser.phone) {
      memberAutoLogin();
    }
  }, 2000);
});

function saveDB() {
  localStorage.setItem('mashoodKuriDB', JSON.stringify(db));
}

function showLogin(type) {
  document.getElementById('loginPage').classList.add('hidden');
  if(type === 'admin') {
    document.getElementById('adminLoginBox').classList.remove('hidden');
  } else {
    document.getElementById('memberLoginBox').classList.remove('hidden');
  }
}

function backToLogin() {
  document.querySelectorAll('.login-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('loginPage').classList.remove('hidden');
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

function showAdminPage() {
  document.querySelectorAll('.login-box, #loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('adminPage').classList.remove('hidden');
  updateStats();
  renderAdminMembers();
  loadMonths();
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
  document.getElementById('totalMembers').textContent = db.members.length;
  const payments = db.payments[currentMonth] || {};
  document.getElementById('paidMembers').textContent = Object.keys(payments).length;
  document.getElementById('pendingMembers').textContent = db.members.length - Object.keys(payments).length;
  const total = Object.values(payments).reduce((sum, amt) => sum + amt, 0);
  document.getElementById('totalCollection').textContent = '₹' + total;
}

function addMemberByAdmin() {
  if(db.members.length >= TOTAL_MONTHS) {
    alert('Maximum ' + TOTAL_MONTHS + ' members only!');
    return;
  }

  const name = document.getElementById('newMemName').value.trim();
  const phone = document.getElementById('newMemPhone').value.trim();
  const pass = document.getElementById('newMemPass').value;
  const amount = parseInt(document.getElementById('newMemAmount').value);

  if(!name ||!phone ||!pass ||!amount) {
    alert('എല്ലാ Fields-ഉം Fill ചെയ്യൂ!');
    return;
  }
  if(db.members.some(m => m.phone === phone)) {
    alert('ഈ Phone Number already ഉണ്ട്!');
    return;
  }

  db.members.push({name,phone,password:pass,amount,active:true,joinDate:new Date().toISOString()});
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
    list.innerHTML = '<p style="text-align:center; padding:20px;">Members ഇല്ല. Add ചെയ്യൂ!</p>';
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
  const member = db.members[index];
  if(member.active === undefined) member.active = true;
  member.active =!member.active;
  saveDB();
  renderAdminMembers();
  alert(member.name + ' ' + (member.active? 'Wheel-ൽ കാണിക്കും' : 'Wheel-ൽ നിന്ന് മറച്ചു'));
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
  if(colMonth) colMonth.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
  renderCollection();
}

function renderCollection() {
  const month = document.getElementById('colMonth')?.value || currentMonth;
  const payments = db.payments[month] || {};
  const list = document.getElementById('collectionList');
  if(!list) return;

  if(db.members.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:20px;">Members ഇല്ല!</p>';
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

function doRandomDraw() {
  const winnerPhones = db.winners.map(w => w.phone);
  if(!db.excludedWinners) db.excludedWinners = [];

  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    const isPaid = payments[m.phone] >= m.amount;
    const isActive = m.active!== false;
    const notWonYet =!winnerPhones.includes(m.phone);
    const notExcluded =!db.excludedWinners.includes(m.phone);
    return isPaid && isActive && notWonYet && notExcluded;
  });

  if(eligible.length === 0) {
    alert('Eligible Members ഇല്ല! Mark Paid ചെയ്യൂ, Show ചെയ്യൂ');
    return;
  }

  document.getElementById('winnerDisplay').innerHTML = `
    <div class="card" style="background: #e8f5e9; padding: 15px;">
      <p>Eligible: ${eligible.length} | Win ആയവർ: ${winnerPhones.length} | Excluded: ${db.excludedWinners.length}</p>
    </div>
  `;
  document.getElementById('wheelContainer').style.display = 'block';
  drawWheel(eligible);
}

function drawWheel(members) {
  const canvas = document.getElementById('wheelCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F'];
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
}

function spinWheelNow() {
  if(wheelSpinning) return;
  wheelSpinning = true;

  const winnerPhones = db.winners.map(w => w.phone);
  if(!db.excludedWinners) db.excludedWinners = [];

  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    const isPaid = payments[m.phone] >= m.amount;
    const isActive = m.active!== false;
    const notWonYet =!winnerPhones.includes(m.phone);
    const notExcluded =!db.excludedWinners.includes(m.phone);
    return isPaid && isActive && notWonYet && notExcluded;
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
  display.innerHTML = `
    <div class="card" style="background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white; text-align: center; padding: 40px; margin-top: 20px;">
      <h2 style="font-size: 40px;">🎉 WINNER 🎉</h2>
      <h1 style="font-size: 50px; margin: 20px 0;">${winner.name}</h1>
      <p style="font-size: 24px;">📱 ${winner.phone}</p>
      <p style="font-size: 28px; margin-top: 20px; font-weight: bold;">💰 ₹${winner.amount}</p>
    </div>
  `;

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
  const winner = db.winners.find(w => w.phone === phone);

  if(index === -1) {
    db.excludedWinners.push(phone);
    saveDB();
    renderAllWinners();
    alert(winner.name + ' Wheel-ൽ നിന്ന് ഒഴിവാക്കി');
  } else {
    db.excludedWinners.splice(index, 1);
    saveDB();
    renderAllWinners();
    alert(winner.name + ' Wheel-ൽ വീണ്ടും ചേർത്തു');
  }
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

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  location.reload();
}

function memberAutoLogin() {
  document.querySelectorAll('.login-box,#loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('memberPage').classList.remove('hidden');
  document.getElementById('memberNameNav').textContent = currentUser.name;
  document.getElementById('memName').textContent = currentUser.name;
  document.getElementById('memPhone').textContent = currentUser.phone;
  document.getElementById('memAmount').textContent = "₹" + currentUser.amount;
}