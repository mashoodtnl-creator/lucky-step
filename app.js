// Mashood കുറി - Lucky Step v16 Pro
let DB = {members:[],payments:{},draws:[],feedback:[],rules:[],chats:{},userType:null,currentUser:null};
let months = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

window.onload = () => {
    setTimeout(() => {
        document.getElementById('splash').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
    }, 2500);
    loadDB();
    initMonths();
};

function loadDB() {
    const saved = localStorage.getItem('mashood_kuri_v16');
    if (saved) DB = JSON.parse(saved);
    if (!DB.rules.length) DB.rules = ['എല്ലാ മാസവും 10-ാം തീയതിക്ക് മുമ്പ് അടവ് നൽകണം','നറുക്കെടുപ്പ് എല്ലാ മാസവും 15-ാം തീയതി','അടവ് മുടക്കിയാൽ അടുത്ത നറുക്കിൽ പങ്കെടുക്കാൻ കഴിയില്ല'];
    saveDB();
}

function saveDB() {
    localStorage.setItem('mashood_kuri_v16', JSON.stringify(DB));
}

function initMonths() {
    const currentMonth = new Date().toISOString().slice(0,7);
    ['colMonth','reportMonth'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = months.map(m => `<option value="${m}" ${m===currentMonth?'selected':''}>${m}</option>`).join('');
    });
}

function showLogin(type) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById(type+'LoginBox').classList.remove('hidden');
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
    if (pass === 'admin123' || pass === 'mashood456') {
        DB.userType = 'admin';
        document.getElementById('adminLoginBox').classList.add('hidden');
        document.getElementById('adminPage').classList.remove('hidden');
        renderDashboard();
        renderAdminMembers();
        renderCollection();
        renderReport();
        renderRules();
    } else {
        alert('Wrong Password! Use: admin123');
    }
}

function memberLogin() {
    const phone = document.getElementById('memberPhone').value;
    const pass = document.getElementById('memberPass').value;
    const member = DB.members.find(m => m.phone === phone && m.password === pass);
    if (member) {
        DB.userType = 'member';
        DB.currentUser = member;
        document.getElementById('memberLoginBox').classList.add('hidden');
        document.getElementById('memberPage').classList.remove('hidden');
        renderMemberDashboard();
    } else {
        alert('Wrong Phone or Password!');
    }
}

function memberRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const amount = parseInt(document.getElementById('regAmount').value) || 1000;
    if (!name ||!phone ||!pass) return alert('Fill all fields!');
    if (DB.members.find(m => m.phone === phone)) return alert('Phone already registered!');
    DB.members.push({id:Date.now(),name,phone,password:pass,amount,address:'',joinDate:new Date().toISOString()});
    saveDB();
    alert('Registration Successful! Please Login.');
    backToLogin();
}

function logout() {
    DB.userType = null;
    DB.currentUser = null;
    location.reload();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
    document.getElementById('admin'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.remove('hidden');
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    if(event) event.target.classList.add('active');
    toggleSidebar();
}

function renderDashboard() {
    const month = new Date().toISOString().slice(0,7);
    const paid = DB.payments[month]? Object.keys(DB.payments[month]).filter(id => DB.payments[month][id].paid).length : 0;
    const collected = DB.payments[month]? Object.values(DB.payments[month]).filter(p => p.paid).reduce((s,p) => s + p.amount, 0) : 0;
    document.getElementById('totalMembers').textContent = DB.members.length;
    document.getElementById('totalCollection').textContent = '₹' + collected;
    document.getElementById('paidMembers').textContent = paid;
    document.getElementById('pendingMembers').textContent = DB.members.length - paid;
    const recent = DB.draws.slice(-3).reverse();
    document.getElementById('recentWinners').innerHTML = recent.length? recent.map(d => {
        const m = DB.members.find(mem => mem.id === d.winnerId);
        return `<p><i class="ri-trophy-line"></i> ${m?m.name:'Unknown'} - ${d.month}</p>`;
    }).join('') : '<p>No draws yet</p>';
}

function addMemberByAdmin() {
    const name = document.getElementById('newMemName').value.trim();
    const phone = document.getElementById('newMemPhone').value.trim();
    const pass = document.getElementById('newMemPass').value.trim();
    const amount = parseInt(document.getElementById('newMemAmount').value) || 1000;
    if (!name ||!phone ||!pass) return alert('Fill all fields!');
    if (DB.members.find(m => m.phone === phone)) return alert('Phone exists!');
    DB.members.push({id:Date.now(),name,phone,password:pass,amount,address:'',joinDate:new Date().toISOString()});
    saveDB();
    document.getElementById('newMemName').value = '';
    document.getElementById('newMemPhone').value = '';
    document.getElementById('newMemPass').value = '';
    renderAdminMembers();
    renderDashboard();
    alert('Member Added!');
}

function renderAdminMembers() {
    const search = document.getElementById('searchMember')?.value.toLowerCase() || '';
    const filtered = DB.members.filter(m => m.name.toLowerCase().includes(search) || m.phone.includes(search));
    document.getElementById('adminMembersList').innerHTML = filtered.map(m => `
        <div class="member-item">
            <div class="member-item-info">
                <h4>${m.name}</h4>
                <p><i class="ri-phone-line"></i> ${m.phone} | ₹${m.amount}/month</p>
            </div>
            <div class="member-actions">
                <button class="small danger" onclick="deleteMember(${m.id})"><i class="ri-delete-bin-line"></i></button>
            </div>
        </div>
    `).join('') || '<p style="text-align:center;color:#999">No members</p>';
}

function deleteMember(id) {
    if (!confirm('Delete this member?')) return;
    DB.members = DB.members.filter(m => m.id!== id);
    saveDB();
    renderAdminMembers();
    renderDashboard();
}

function renderCollection() {
    const month = document.getElementById('colMonth').value;
    if (!DB.payments[month]) DB.payments[month] = {};
    document.getElementById('collectionList').innerHTML = DB.members.map(m => {
        const paid = DB.payments[month][m.id]?.paid || false;
        return `
            <div class="member-item">
                <div class="member-item-info">
                    <h4>${m.name}</h4>
                    <p>₹${m.amount}</p>
                </div>
                <button class="${paid?'secondary':'info'}" onclick="togglePayment(${m.id},'${month}')">
                    ${paid?'✓ Paid':'Mark Paid'}
                </button>
            </div>
        `;
    }).join('');
}

function togglePayment(memberId, month) {
    if (!DB.payments[month]) DB.payments[month] = {};
    if (!DB.payments[month][memberId]) DB.payments[month][memberId] = {paid:false,amount:0,date:''};
    const member = DB.members.find(m => m.id === memberId);
    DB.payments[month][memberId].paid =!DB.payments[month][memberId].paid;
    DB.payments[month][memberId].amount = member.amount;
    DB.payments[month][memberId].date = new Date().toISOString();
    saveDB();
    renderCollection();
    renderDashboard();
}

function markAllPaid() {
    const month = document.getElementById('colMonth').value;
    if (!DB.payments[month]) DB.payments[month] = {};
    DB.members.forEach(m => {
        DB.payments[month][m.id] = {paid:true,amount:m.amount,date:new Date().toISOString()};
    });
    saveDB();
    renderCollection();
    renderDashboard();
    alert('All marked as paid!');
}

function sendWhatsAppReminders() {
    const month = document.getElementById('colMonth').value;
    const unpaid = DB.members.filter(m =>!DB.payments[month]?.[m.id]?.paid);
    if (!unpaid.length) return alert('All paid!');
    const msg = encodeURIComponent(`Mashood കുറി - ${month} മാസ അടവ് ₹${unpaid[0].amount} ബാക്കിയുണ്ട്. ദയവായി അടയ്ക്കുക.`);
    unpaid.forEach(m => {
        window.open(`https://wa.me/${m.phone}?text=${msg}`, '_blank');
    });
}

function doRandomDraw() {
    const month = document.getElementById('colMonth').value;
    const eligible = DB.members.filter(m => DB.payments[month]?.[m.id]?.paid);
    if (!eligible.length) return alert('No paid members!');
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    DB.draws.push({id:Date.now(),month,winnerId:winner.id,date:new Date().toISOString(),type:'random'});
    saveDB();
    document.getElementById('winnerDisplay').innerHTML = `<div class="card" style="background:#fff3cd;border:2px solid var(--gold);text-align:center"><h2>🎉 Winner 🎉</h2><h1 style="color:var(--green);margin:20px 0">${winner.name}</h1><p>${winner.phone}</p><p>${month}</p></div>`;
    renderDashboard();
}

function selectManualWinner() {
    const winnerId = parseInt(document.getElementById('manualWinner').value);
    const month = document.getElementById('colMonth').value;
    const winner = DB.members.find(m => m.id === winnerId);
    if (!winner) return;
    DB.draws.push({id:Date.now(),month,winnerId:winner.id,date:new Date().toISOString(),type:'manual'});
    saveDB();
    document.getElementById('winnerDisplay').innerHTML = `<div class="card" style="background:#fff3cd;border:2px solid var(--gold);text-align:center"><h2>👑 Admin Selected Winner 👑</h2><h1 style="color:var(--green);margin:20px 0">${winner.name}</h1><p>${winner.phone}</p><p>${month}</p></div>`;
    renderDashboard();
}

function renderReport() {
    const month = document.getElementById('reportMonth').value;
    const payments = DB.payments[month] || {};
    const paid = Object.values(payments).filter(p => p.paid).length;
    const total = Object.values(payments).filter(p => p.paid).reduce((s,p) => s + p.amount, 0);
    document.getElementById('reportSummary').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><i class="ri-checkbox-circle-fill"></i><div><h2>${paid}</h2><p>Paid</p></div></div>
            <div class="stat-card"><i class="ri-money-rupee-circle-fill"></i><div><h2>₹${total}</h2><p>Total</p></div></div>
        </div>
    `;
    document.getElementById('reportTable').innerHTML = `
        <div class="card">
            <table style="width:100%;border-collapse:collapse">
                <tr style="background:var(--green);color:white">
                    <th style="padding:10px;text-align:left">Name</th>
                    <th style="padding:10px;text-align:left">Phone</th>
                    <th style="padding:10px;text-align:left">Amount</th>
                    <th style="padding:10px;text-align:left">Status</th>
                </tr>
                ${DB.members.map(m => {
                    const p = payments[m.id];
                    return `<tr style="border-bottom:1px solid #ddd">
                        <td style="padding:10px">${m.name}</td>
                        <td style="padding:10px">${m.phone}</td>
                        <td style="padding:10px">₹${m.amount}</td>
                        <td style="padding:10px">${p?.paid?'<span style="color:green">✓ Paid</span>':'<span style="color:red">Pending</span>'}</td>
                    </tr>`;
                }).join('')}
            </table>
        </div>
    `;
}

function exportCSV() {
    const month = document.getElementById('reportMonth').value;
    const payments = DB.payments[month] || {};
    let csv = 'Name,Phone,Amount,Status,Date\n';
    DB.members.forEach(m => {
        const p = payments[m.id];
        csv += `${m.name},${m.phone},${m.amount},${p?.paid?'Paid':'Pending'},${p?.date||''}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mashood-Kuri-${month}.csv`;
    a.click();
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const month = document.getElementById('reportMonth').value;
    doc.setFontSize(18);
    doc.text('Mashood കുറി - Monthly Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Month: ${month}`, 20, 30);
    let y = 45;
    DB.members.forEach((m,i) => {
        const p = DB.payments[month]?.[m.id];
        doc.text(`${i+1}. ${m.name} - ${m.phone} - ₹${m.amount} - ${p?.paid?'Paid':'Pending'}`, 20, y);
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`Mashood-Kuri-${month}.pdf`);
}

function addRule() {
    const rule = document.getElementById('newRule').value.trim();
    if (!rule) return;
    DB.rules.push(rule);
    saveDB();
    document.getElementById('newRule').value = '';
    renderRules();
}

function renderRules() {
    document.getElementById('rulesList').innerHTML = DB.rules.map((r,i) => `
        <div class="member-item">
            <div class="member-item-info"><p>${i+1}. ${r}</p></div>
            <button class="small danger" onclick="deleteRule(${i})"><i class="ri-delete-bin-line"></i></button>
        </div>
    `).join('');
}

function deleteRule(i) {
    DB.rules.splice(i,1);
    saveDB();
    renderRules();
}

function renderMemberDashboard() {
    const m = DB.currentUser;
    document.getElementById('memberNameNav').textContent = m.name;
    document.getElementById('memName').textContent = m.name;
    document.getElementById('memPhone').textContent = m.phone;
    document.getElementById('memAmount').textContent = '₹' + m.amount;
    let paidCount = 0, dueCount = 0;
    months.forEach(month => {
        if (DB.payments[month]?.[m.id]?.paid) paidCount++;
        else dueCount++;
    });
    document.getElementById('memPaidCount').textContent = paidCount;
    document.getElementById('memDueCount').textContent = dueCount;
    const currentMonth = new Date().toISOString().slice(0,7);
    const paid = DB.payments[currentMonth]?.[m.id]?.paid;
    document.getElementById('memPaymentStatus').innerHTML = paid
      ? `<p style="color:green"><i class="ri-checkbox-circle-fill"></i> Paid for ${currentMonth}</p>`
        : `<p style="color:red"><i class="ri-time-fill"></i> Pending for ${currentMonth} - ₹${m.amount}</p>`;
    renderMemberChat();
}

function renderMemberChat() {
    const msgs = DB.chats[DB.currentUser.id] || [];
    document.getElementById('memChatBox').innerHTML = msgs.map(m => `
        <div class="chat-msg ${m.from}">${m.text}<div class="time">${new Date(m.time).toLocaleTimeString()}</div></div>
    `).join('');
    document.getElementById('memChatBox').scrollTop = document.getElementById('memChatBox').scrollHeight;
}

function sendMemberChat() {
    const msg = document.getElementById('memChatMsg').value.trim();
    if (!msg) return;
    if (!DB.chats[DB.currentUser.id]) DB.chats[DB.currentUser.id] = [];
    DB.chats[DB.currentUser.id].push({from:'member',text:msg,time:new Date().toISOString()});
    saveDB();
    document.getElementById('memChatMsg').value = '';
    renderMemberChat();
}

function submitMemberFeedback() {
    const text = document.getElementById('memFeedback').value.trim();
    if (!text) return;
    DB.feedback.push({name:DB.currentUser.name,text,date:new Date().toISOString()});
    saveDB();
    document.getElementById('memFeedback').value = '';
    alert('Feedback Submitted!');
}