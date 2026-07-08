// പേജ് ലോഡ് ചെയ്യുമ്പോൾ സേവ് ചെയ്ത വിവരങ്ങൾ കാണിക്കാൻ
window.onload = function() {
    let storedData = localStorage.getItem("chittyData");
    if (storedData) {
        document.getElementById("memberTable").innerHTML = storedData;
    }
};

function addMember() {
    let name = document.getElementById("name").value;
    let amount = document.getElementById("amount").value;
    
    if (name && amount) {
        let table = document.getElementById("memberTable");
        let row = table.insertRow();
        row.insertCell(0).innerHTML = name;
        row.insertCell(1).innerHTML = amount;
        
        // വിവരങ്ങൾ localStorage-ൽ സേവ് ചെയ്യാൻ
        localStorage.setItem("chittyData", table.innerHTML);
        
        document.getElementById("name").value = "";
        document.getElementById("amount").value = "";
    } else {
        alert("വിവരങ്ങൾ പൂരിപ്പിക്കുക!");
    }
}

// ഡാറ്റ ക്ലിയർ ചെയ്യാൻ ഒരു ബട്ടൺ വേണമെങ്കിൽ
function clearData() {
    localStorage.removeItem("chittyData");
    location.reload();
}
