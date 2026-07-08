function login() {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

function runDraw() {
    const members = ["അനസ്", "മഷൂദ്", "രവി", "സുനിത"];
    let winner = members[Math.floor(Math.random() * members.length)];
    document.getElementById("winner-display").innerHTML = "വിജയി: " + winner;
}
