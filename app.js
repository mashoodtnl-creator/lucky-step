// ===== STARTUP FIX =====
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Loaded');

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.log('SW:', e));
  }

  // Splash hide - 1.5 sec മാത്രം
  setTimeout(function() {
    const splash = document.getElementById('splash');
    const mainContainer = document.getElementById('mainContainer');

    if(splash) splash.style.display = 'none';
    if(mainContainer) mainContainer.style.display = 'block';

    console.log('App ready');
    initApp();
  }, 1500);

  // Dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
});

function initApp() {
  try {
    if(currentUser === 'admin') {
      showAdminPage();
    } else if(currentUser && currentUser.phone) {
      memberAutoLogin();
    } else {
      document.getElementById('loginPage').classList.remove('hidden');
    }
  } catch(e) {
    console.error('Init Error:', e);
    document.getElementById('loginPage').classList.remove('hidden');
  }
}

function memberAutoLogin() {
  document.querySelectorAll('.login-box,#loginPage').forEach(el => el.classList.add('hidden'));
  document.getElementById('memberPage').classList.remove('hidden');
  document.getElementById('memberNameNav').textContent = currentUser.name;
  document.getElementById('memName').textContent = currentUser.name || 'Not Set';
  document.getElementById('memPhone').textContent = currentUser.phone || 'Not Set';
  document.getElementById('memAmount').textContent = "₹" + (currentUser.amount || 0);

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