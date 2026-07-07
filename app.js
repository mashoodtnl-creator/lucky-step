function doRandomDraw() {
  // 1. വിജയിച്ചവരുടെ phone numbers list എടുക്കൂ
  const winnerPhones = db.winners.map(w => w.phone);

  // 2. Active + Paid + ഇതുവരെ Win ആവാത്തവർ മാത്രം
  const eligible = db.members.filter(m => {
    const payments = db.payments[currentMonth] || {};
    const isPaid = payments[m.phone] >= m.amount;
    const isActive = m.active!== false;
    const notWonYet =!winnerPhones.includes(m.phone); // ← Win ആവാത്തവർ മാത്രം
    return isPaid && isActive && notWonYet;
  });

  if(eligible.length === 0) {
    const totalWinners = db.winners.length;
    if(totalWinners >= db.members.length) {
      alert(`❌ എല്ലാവരും Win ആയി കഴിഞ്ഞു! Total Winners: ${totalWinners}/${db.members.length}\n\nപുതിയ കുറി start ചെയ്യാൻ Winners clear ചെയ്യൂ.`);
    } else {
      alert('❌ Eligible Members ഇല്ല!\n\n1. Collection-ൽ Mark Paid ചെയ്യൂ\n2. Members-ൽ Show ചെയ്യൂ\n3. Win ആവാത്തവർ വേണം');
    }
    return;
  }

  document.getElementById('winnerDisplay').innerHTML = `
    <div class="card" style="background: #e8f5e9; padding: 15px; margin-bottom: 15px;">
      <p style="margin:0; color:green; font-weight:600;">
        ✅ Eligible Members: ${eligible.length} / ${db.members.length}
        (Win ആയവർ: ${winnerPhones.length})
      </p>
    </div>
  `;
  document.getElementById('wheelContainer').style.display = 'block';
  drawWheel(eligible);
}