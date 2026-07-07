// മുകളിൽ let currentUser = null; എന്നതിന് പകരം
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// adminLogin() function-ൽ ഇത് add ചെയ്യുക
function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  if(pass === db.admin.password) {
    currentUser = 'admin';
    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // ഇത് add ചെയ്യുക
    showAdminPage();
  } else {
    alert('❌ തെറ്റായ Password!');
  }
}

// memberLogin() function-ലും ഇത് add ചെയ്യുക
function memberLogin() {
  const phone = document.getElementById('memberPhone').value;
  const pass = document.getElementById('memberPass').value;
  const member = db.members.find(m => m.phone === phone && m.password === pass);
  if(member){
    currentUser = member;
    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // ഇത് add ചെയ്യുക
    document.querySelectorAll('.login-box,#loginPage').forEach(el => el.classList.add('hidden'));
    document.getElementById('memberPage').classList.remove('hidden');
    //... ബാക്കി code
  } else {
    alert('തെറ്റായ Login വിവരങ്ങൾ');
  }
}

// logout() function മാറ്റുക
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser'); // ഇത് add ചെയ്യുക
  location.reload();
}

// Page load ആവുമ്പോൾ auto login check ചെയ്യാൻ - splash timeout-ന് താഴെ ഇത് add ചെയ്യുക
setTimeout(() => {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
  
  // Auto login check
  if(currentUser === 'admin') {
    showAdminPage();
  } else if(currentUser && currentUser.phone) {
    // Member auto login
    document.querySelectorAll('.login-box,#loginPage').forEach(el => el.classList.add('hidden'));
    document.getElementById('memberPage').classList.remove('hidden');
    document.getElementById('memberNameNav').textContent = currentUser.name;
    document.getElementById('memName').textContent = currentUser.name;
    document.getElementById('memPhone').textContent = currentUser.phone;
    document.getElementById('memAmount').textContent = "₹" + currentUser.amount;
  }
}, 3000);