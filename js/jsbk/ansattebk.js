let ansatte = [];

async function lastAnsatte() {
  const { data, error } = await supabaseClient
    .from("ansatte")
    .select("*")
    .order("navn");

  if (error) {
    console.error("Feil ved henting av ansatte:", error);
    alert("Feil ved henting av ansatte");
    return;
  }

  ansatte = data || [];
  visAnsatte();
}

function visAnsatte() {
  const tbody = document.getElementById("ansattListe");
  if (!tbody) {
    console.error("Fant ikke ansattListe i HTML");
    return;
  }

  tbody.innerHTML = "";

  ansatte.forEach(ansatt => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${ansatt.navn || ""}</td>
      <td>${ansatt.epost || ""}</td>
      <td>${ansatt.mobil || ""}</td>
      <td>
        <button type="button" onclick="redigerAnsatt('${ansatt.id}')">Rediger</button>
        <button type="button" onclick="slettAnsatt('${ansatt.id}')">Slett</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function redigerAnsatt(id) {
  const ansatt = ansatte.find(a => String(a.id) === String(id));

  if (!ansatt) {
    alert("Fant ikke ansatt");
    return;
  }

  document.getElementById("ansattId").value = ansatt.id || "";
  document.getElementById("ansattNavn").value = ansatt.navn || "";
  document.getElementById("ansattEpost").value = ansatt.epost || "";
  document.getElementById("ansattMobil").value = ansatt.mobil || "";
}

async function lagreAnsatt() {
  const id = document.getElementById("ansattId").value;

  const ansatt = {
    navn: document.getElementById("ansattNavn").value.trim(),
    epost: document.getElementById("ansattEpost").value.trim(),
    mobil: document.getElementById("ansattMobil").value.trim()
  };

  if (!ansatt.navn) {
    alert("Navn må fylles ut");
    return;
  }

  if (!ansatt.epost) {
    alert("E-post må fylles ut");
    return;
  }

  let error;

  if (id) {
    const result = await supabaseClient
      .from("ansatte")
      .update(ansatt)
      .eq("id", id);

    error = result.error;
  } else {
    const result = await supabaseClient
      .from("ansatte")
      .insert([ansatt]);

    error = result.error;
  }

  if (error) {
    console.error("Feil ved lagring av ansatt:", error);
    alert("Feil ved lagring av ansatt");
    return;
  }

  nyttAnsattSkjema();
  await lastAnsatte();
}

function nyttAnsattSkjema() {
  document.getElementById("ansattId").value = "";
  document.getElementById("ansattNavn").value = "";
  document.getElementById("ansattEpost").value = "";
  document.getElementById("ansattMobil").value = "";
}

async function slettAnsatt(id) {
  if (!confirm("Vil du slette denne ansatte?")) return;

  const { error } = await supabaseClient
    .from("ansatte")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Feil ved sletting av ansatt:", error);
    alert("Feil ved sletting av ansatt");
    return;
  }

  await lastAnsatte();
}

document.addEventListener("DOMContentLoaded", () => {
  const lagreKnapp = document.getElementById("lagreAnsattKnapp");
  const nyKnapp = document.getElementById("nyAnsattKnapp");

  if (lagreKnapp) {
    lagreKnapp.onclick = lagreAnsatt;
  }

  if (nyKnapp) {
    nyKnapp.onclick = nyttAnsattSkjema;
  }

  lastAnsatte();
});