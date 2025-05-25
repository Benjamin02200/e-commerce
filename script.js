document.addEventListener("DOMContentLoaded", loadItems);

function loadItems() {
  const list = document.getElementById("stock-list");
  list.innerHTML = "";
  const items = JSON.parse(localStorage.getItem("stock")) || [];

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-details">${item.name} - ${item.quantity} pcs</div>
      <label class="status">
        <input type="checkbox" ${item.sent ? "checked" : ""} onchange="toggleSent(${index})">
        Déjà envoyé
      </label>
      <button onclick="removeItem(${index})">Supprimer</button>
    `;
    list.appendChild(li);
  });
}

function addItem() {
  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value);
  const pdfInput = document.getElementById("item-pdf");
  const file = pdfInput.files[0];

  if (!name || isNaN(quantity)) {
    alert("Veuillez remplir correctement le nom et la quantité.");
    return;
  }

  if (!file) {
    alert("Veuillez sélectionner un fichier PDF.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const pdfBase64 = event.target.result;

    const items = JSON.parse(localStorage.getItem("stock")) || [];
    items.push({ name, quantity, sent: false, pdfBase64 });
    localStorage.setItem("stock", JSON.stringify(items));

    document.getElementById("item-name").value = "";
    document.getElementById("item-quantity").value = "";
    pdfInput.value = "";

    loadItems();
  };
  reader.readAsDataURL(file);
}

function removeItem(index) {
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  items.splice(index, 1);
  localStorage.setItem("stock", JSON.stringify(items));
  loadItems();
}

function toggleSent(index) {
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  items[index].sent = !items[index].sent;
  localStorage.setItem("stock", JSON.stringify(items));
  loadItems();
}

function printShippingList() {
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  const toSend = items.filter(item => !item.sent);

  if (toSend.length === 0) {
    alert("Tous les articles ont déjà été envoyés !");
    return;
  }

  let content = "<h1>📦 Liste des Articles à Envoyer</h1><ul>";
  toSend.forEach(item => {
    content += `<li>${item.name} - ${item.quantity} pcs</li><br>`;
  });
  content += "</ul><p>Date : " + new Date().toLocaleDateString() + "</p>";

  const win = window.open("", "Liste d'expédition", "width=600,height=800");
  win.document.write(`
    <html>
      <head>
        <title>Liste pour la Poste</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          h1 { text-align: center; }
          ul { font-size: 1.2rem; }
          li { margin-bottom: 1rem; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function showToSend() {
  const sendDiv = document.getElementById("send-section");
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  const toSend = items.map((item, index) => ({ ...item, index }))
                      .filter(item => !item.sent);

  if (toSend.length === 0) {
    sendDiv.innerHTML = "<p>Aucun article à envoyer.</p>";
    return;
  }

  let html = "<h2>📮 Articles prêts à être envoyés</h2><ul>";
  toSend.forEach(item => {
    html += `<li>
      <strong>${item.name}</strong> - ${item.quantity} quantité<br>
      <button onclick="printAndRemove(${item.index})">📮 Coller & Envoyer</button>
    </li><br>`;
  });
  html += "</ul>";

  sendDiv.innerHTML = html;
}

function printAndRemove(index) {
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  const item = items[index];
  if (!item) return;

  if (item.pdfBase64) {
    const pdfWindow = window.open("");
    pdfWindow.document.write(
      `<iframe width='100%' height='100%' src='${item.pdfBase64}'></iframe>`
    );
  } else {
    alert("Pas de PDF associé à cet article.");
  }

  items.splice(index, 1);
  localStorage.setItem("stock", JSON.stringify(items));
  loadItems();
  showToSend();
}
