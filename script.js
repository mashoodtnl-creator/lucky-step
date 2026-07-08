function login() {
    let user = document.getElementById("username").value;
    if (user === "admin") {
        document.getElementById("login-box").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    } else {
        alert("തെറ്റായ യൂസർനെയിം!");
    }
}

function addMember() {
    let name = document.getElementById("memberName").value;
    if (name) {
        let table = document.getElementById("memberTable");
        let row = table.insertRow();
        row.insertCell(0).innerHTML = name;
        document.getElementById("memberName").value = "";
    }
}

function runDraw() {
    let table = document.getElementById("memberTable");
    let rows = table.rows;
    if (rows.length > 1) {
        let randomIndex = Math.floor(Math.random() * (rows.length - 1)) + 1;
        let winner = rows[randomIndex].cells[0].innerHTML;
        document.getElementById("winner").innerHTML = "വിജയി: " + winner;
    } else {
        alert("അംഗങ്ങളെ ചേർക്കൂ!");
    }
}
