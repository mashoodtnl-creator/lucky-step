function addMember() {
    let name = document.getElementById("name").value;
    let amount = document.getElementById("amount").value;
    
    if (name && amount) {
        let table = document.getElementById("memberTable");
        let row = table.insertRow();
        row.insertCell(0).innerHTML = name;
        row.insertCell(1).innerHTML = amount;
        
        // ക്ലിയർ ചെയ്യാൻ
        document.getElementById("name").value = "";
        document.getElementById("amount").value = "";
    } else {
        alert("വിവരങ്ങൾ പൂരിപ്പിക്കുക!");
    }
}
