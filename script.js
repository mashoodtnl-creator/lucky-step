document.addEventListener('DOMContentLoaded', function() {
    let members = JSON.parse(localStorage.getItem('chitMembers')) || [];
    let monthlyAmount = parseInt(localStorage.getItem('chitAmount')) || 5000;
    let currentMonthWinner = localStorage.getItem('monthWinner') || '-';
    let wheelSpinning = false;
    let currentRotation = 0;

    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1'];

    function saveData() {
        localStorage.setItem('chitMembers', JSON.stringify(members));
        localStorage.setItem('chitAmount', monthlyAmount);
        localStorage.setItem('monthWinner', currentMonthWinner);
        render();
        drawWheel();
    }

    function addMember() {
        const name = document.getElementById('memberName').value.trim();
        const phone = document.getElementById('memberPhone').value.trim();
        if (!name) return alert('പേര് enter ചെയ്യൂ');
        
        members.push({ id: Date.now(), name, phone, paid: false, won: false });
        document.getElementById('memberName').value = '';
        document.getElementById('memberPhone').value = '';
        saveData();
    }

    function togglePaid(id) {
        members = members.map(m => m.id === id? {...m, paid:!m.paid} : m);
        saveData();
    }

    function deleteMember(id) {
        if (confirm('ഈ അംഗത്തെ delete ചെയ്യണോ?')) {
            members = members.filter(m => m.id!== id);
            saveData();
        }
    }

    function updateAmount() {
        const newAmount = parseInt(document.getElementById('chitAmount').value);
        if (newAmount > 0) {
            monthlyAmount = newAmount;
            saveData();
        } else {
            alert('ശരിയായ തുക enter ചെയ്യൂ');
        }
    }

    function resetMonth() {
        if (confirm('പുതിയ മാസം തുടങ്ങണോ? Payment status reset ആവും')) {
            members = members.map(m => ({...m, paid: false, won: false}));
            currentMonthWinner = '-';
            document.getElementById('winnerText').textContent = '';
            saveData();
        }
    }

    function getWheelMembers() {
        const filter = document.getElementById('wheelFilter').value;
        if (filter === 'paid') return members.filter(m => m.paid &&!m.won);
        if (filter === 'unpaid') return members.filter(m =>!m.paid &&!m.won);
        return members.filter(m =>!m.won);
    }

    function drawWheel() {
        const wheelMembers = getWheelMembers();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 180;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (wheelMembers.length === 0) {
            ctx.fillStyle = '#475569';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('അംഗങ്ങളില്ല', centerX, centerY);
            return;
        }

        const anglePerSlice = (2 * Math.PI) / wheelMembers.length;
        
        wheelMembers.forEach((member, i) => {
            const startAngle = currentRotation + i * anglePerSlice;
            const endAngle = startAngle + anglePerSlice;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSlice / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(member.name, radius - 10, 5);
            ctx.restore();
        });
    }

    function spinWheel() {
        if (wheelSpinning) return;
        const wheelMembers = getWheelMembers();
        if (wheelMembers.length === 0) return alert('Wheel-ൽ ഇടാൻ ആളില്ല');
        
        wheelSpinning = true;
        document.getElementById('winnerText').textContent = 'കറങ്ങുന്നു...';
        
        const spins = 5 + Math.random() * 5;
        const finalAngle = Math.random() * 2 * Math.PI;
        const totalRotation = spins * 2 * Math.PI + finalAngle;
        const duration = 4000;
        const startTime = Date.now();
        const startRotation = currentRotation;
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easing = 1 - Math.pow(1 - progress, 3);
            
            currentRotation = startRotation + totalRotation * easing;
            drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                wheelSpinning = false;
                const anglePerSlice = (2 * Math.PI) / wheelMembers.length;
                const normalizedRotation = (2 * Math.PI - (currentRotation % (2 * Math.PI))) % (2 * Math.PI);
                const winnerIndex = Math.floor(normalizedRotation / anglePerSlice);
                const winner = wheelMembers[winnerIndex];
                
                document.getElementById('winnerText').textContent = `🎉 Winner: ${winner.name} 🎉`;
                currentMonthWinner = winner.name;
            }
        }
        animate();
    }

    function saveWinner() {
        if (currentMonthWinner === '-') return alert('ആദ്യം wheel കറക്കി winner select ചെയ്യൂ');
        const winnerMember = members.find(m => m.name === currentMonthWinner);
        if (winnerMember) {
            members = members.map(m => m.id === winnerMember.id? {...m, won: true} : m);
            saveData();
            alert(`Winner ${currentMonthWinner} save ചെയ്തു!`);
        }
    }

    function render() {
        const tbody = document.getElementById('memberBody');
        tbody.innerHTML = '';
        
        let collected = 0;
        members.forEach(m => {
            if (m.paid) collected += monthlyAmount;
            const row = document.createElement('tr');
            if (m.won) row.classList.add('winner');
            
            row.innerHTML = `
                <td>${m.name}</td>
                <td>${m.phone}</td>
                <td class="${m.paid? 'paid' : 'unpaid'}">
                    ${m.paid? 'Paid ✓' : 'Pending'}
                </td>
                <td>${m.won? '🏆 Won' : '-'}</td>
                <td>
                    <button class="paidBtn" data-id="${m.id}">
                        ${m.paid? 'Undo' : 'Mark Paid'}
                    </button>
                    <button class="btn-danger deleteBtn" data-id="${m.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Event delegation for dynamic buttons
        document.querySelectorAll('.paidBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                togglePaid(parseInt(this.dataset.id));
            });
        });
        
        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteMember(parseInt(this.dataset.id));
            });
        });

        document.getElementById('totalMembers').textContent = members.length;
        document.getElementById('monthlyAmount').textContent = monthlyAmount;
        document.getElementById('collected').textContent = collected;
        document.getElementById('pending').textContent = (members.length * monthlyAmount) - collected;
        document.getElementById('currentWinner').textContent = currentMonthWinner;
    }

    // Event Listeners
    document.getElementById('spinBtn').addEventListener('click', spinWheel);
    document.getElementById('saveWinnerBtn').addEventListener('click', saveWinner);
    document.getElementById('updateAmountBtn').addEventListener('click', updateAmount);
    document.getElementById('resetMonthBtn').addEventListener('click', resetMonth);
    document.getElementById('addMemberBtn').addEventListener('click', addMember);
    document.getElementById('wheelFilter').addEventListener('change', drawWheel);

    // Enter key support for adding member
    document.getElementById('memberName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMember();
    });
    document.getElementById('memberPhone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMember();
    });

    // Init
    document.getElementById('chitAmount').value = monthlyAmount;
    render();
    drawWheel();
});