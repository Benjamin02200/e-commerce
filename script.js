// 🔥 Remplace ici par ta propre config Firebase
const firebaseConfig = {
  apiKey: "TA_CLE",
  authDomain: "ton-projet.firebaseapp.com",
  projectId: "ton-projet",
  storageBucket: "ton-projet.appspot.com",
  messagingSenderId: "xxx",
  appId: "xxx"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const stockRef = db.collection("stock");

document.addEventListener("DOMContentLoaded", loadItems);

function loadItems() {
  stockRef.orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const list = document.getElementById("stock-list");
    list.innerHTML = "";
    snapshot.forEach(doc => {
      const item = doc.data();
      const id = doc.id;
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="item-details">${item.name} - ${item.quantity} pcs</div>
        <label class="status">
          <input type="checkbox" ${item.sent ? "checked" : ""} onchange="toggleSent('${id}', ${!item.sent})">
          Déjà envoyé
        </label>
        <button onclick="removeItem('${id}')">Supprimer</button>
      `;
      list.appendChild(li);
    });
  });
}

function addItem() {
  const name = document.getElementById("item-name").value.trim();
  const quantity = parseInt(document.getElementById("item-quantity").value);
  const file = document.getElementById("item-pdf").files[0];

  if (!name || isNaN(quantity)) return alert("Remplissez le nom et la quantité.");
  if (!file) return alert("Ajoutez un fichier PDF.");

  const reader = new FileReader();
  reader.onload = function (event) {
    const pdfBase64 = event.target.result;

    stockRef.add({
      name,
      quantity,
      sent: false,
      pdfBase64,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("item-name").value = "";
    document.getElementById("item-quantity").value = "";
    document.getElementById("item-pdf").value = "";
  };
  reader.readAsDataURL(file);
}

function removeItem(id) {
  stockRef.doc(id).delete();
}

function toggleSent(id, value) {
  stockRef.doc(id).update({ sent: value });
}

function printShippingList() {
  stockRef.where("sent", "==", false).get().then(snapshot => {
    if (snapshot.empty) return alert("Tous les articles ont été envoyés.");

    let content = "<h1>📦 Liste des Articles à Envoyer</h1><ul>";
    snapshot.forEach(doc => {
      const item = doc.data();
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
  });
}

function showToSend() {
  const sendDiv = document.getElementById("send-section");
  stockRef.where("sent", "==", false).get().then(snapshot => {
    if (snapshot.empty) {
      sendDiv.innerHTML = "<p>Aucun article à envoyer.</p>";
      return;
    }

    let html = "<h2>📮 Articles prêts à être envoyés</h2><ul>";
    snapshot.forEach(doc => {
      const item = doc.data();
      const id = doc.id;
      html += `<li>
        <strong>${item.name}</strong> - ${item.quantity} quantité<br>
        <button onclick="printAndRemove('${id}')">📮 Coller & Envoyer</button>
      </li><br>`;
    });
    html += "</ul>";
    sendDiv.innerHTML = html;
  });
}

function printAndRemove(id) {
  stockRef.doc(id).get().then(doc => {
    const item = doc.data();
    if (!item) return;

    if (item.pdfBase64) {
      const pdfWindow = window.open("");
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' src='${item.pdfBase64}'></iframe>`
      );
    } else {
      alert("Pas de PDF associé à cet article.");
    }

    stockRef.doc(id).delete();
  });
}

// Vérification d'accès admin
if (location.pathname.includes("admin.html") && localStorage.getItem("adminLoggedIn") !== "true") {
  alert("Accès refusé. Veuillez vous connecter.");
  window.location.href = "index.html";
}

function logout() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", loadItems);

function loadItems() {
  const list = document.getElementById("stock-list");
  list.innerHTML = "";
  const items = JSON.parse(localStorage.getItem("stock")) || [];

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-details">
        ${item.name} - ${item.quantity} pcs<br>
        <small>📄 Fichier: ${item.pdfBase64 ? "PDF disponible" : "Aucun"}</small>
      </div>
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
  if (!confirm("Supprimer cet article ?")) return;
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

function markAllAsSent() {
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  items.forEach(item => item.sent = true);
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
    <html><head><title>Liste pour la Poste</title><style>
      body { font-family: sans-serif; padding: 2rem; }
      h1 { text-align: center; }
      ul { font-size: 1.2rem; }
      li { margin-bottom: 1rem; }
    </style></head><body>${content}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function showToSend() {
  const sendDiv = document.getElementById("send-section");
  const items = JSON.parse(localStorage.getItem("stock")) || [];
  const toSend = items.map((item, index) => ({ ...item, index })).filter(item => !item.sent);

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
    const link = document.createElement("a");
    link.href = item.pdfBase64;
    link.download = `${item.name}.pdf`;
    link.click();
  } else {
    alert("Pas de PDF associé à cet article.");
  }

  items.splice(index, 1);
  localStorage.setItem("stock", JSON.stringify(items));
  loadItems();
  showToSend();
}