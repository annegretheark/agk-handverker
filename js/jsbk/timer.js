let timer = [];

async function lastTimer() {
  const { data, error } = await supabaseClient
    .from("timer")
    .select("*, kunder(navn), ansatte(navn, ansatt_nr)")
    .order("dato", { ascending: false });

  if (error) {
    alert("Feil ved henting av timer: " + error.message);
    return;
  }

  timer = data || [];
  visTimer();
}

function beregnTimer(start, slutt) {
  if (!start || !slutt) return { timer: 0, overtid50: 0, overtid100: 0 };

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = slutt.split(":").map(Number);

  let startMin = sh * 60 + sm;
  let sluttMin = eh * 60 + em;

  if (sluttMin < startMin) sluttMin += 24 * 60;

  const total = (sluttMin - startMin) / 60;

  let o50 = 0;
  let o100 = 0;

  const grense50 = 16 * 60;
  const grense100 = 21 * 60;

  for (let m = startMin; m < sluttMin; m += 15) {
    const klokke = m % (24 * 60);

    if (klokke >= grense100) o100 += 0.25;
    else if (klokke >= grense50) o50 += 0.25;
  }

  return { timer: total, overtid50: o50, overtid100: o100 };
}

function leggTilTillegg() {
  const tekst = document.getElementById("tilleggTekst").value.trim();
  const belop = Number(document.getElementById("tilleggBelop").value || 0);

  if (!tekst || !belop) {
    alert("Fyll inn tekst og beløp");
    return;
  }

  const liste = document.getElementById("tilleggListe");

  const div = document.createElement("div");
  div.className = "tilleggRad";
  div.dataset.belop = belop;

  div.innerHTML = `
    ${tekst}: ${belop} kr
    <button type="button" onclick="this.parentElement.remove()">Fjern</button>
  `;

  liste.appendChild(div);

  document.getElementById("tilleggTekst").value = "";
  document.getElementById("tilleggBelop").value = "";
}

function hentTilleggSum() {
  let sum = 0;

  document.querySelectorAll("#tilleggListe .tilleggRad").forEach(rad => {
    sum += Number(rad.dataset.belop || 0);
  });

  return sum;
}

async function finnesDobbelTimer(ansattId, kundeId, dato, startTid, sluttTid) {
  const { data, error } = await supabaseClient
    .from("timer")
    .select("id")
    .eq("ansatt_id", ansattId)
    .eq("kunde_id", Number(kundeId))
    .eq("dato", dato)
    .eq("start_tid", startTid)
    .eq("slutt_tid", sluttTid)
    .limit(1);

  if (error) {
    alert("Feil ved dobbeltsjekk: " + error.message);
    return true;
  }

  return data && data.length > 0;
}

function datoIDag() {
  const iDag = new Date();
  const yyyy = iDag.getFullYear();
  const mm = String(iDag.getMonth() + 1).padStart(2, "0");
  const dd = String(iDag.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

async function lagreTimer() {
  const kundeId = document.getElementById("kundeValg").value;
  const ansattId = document.getElementById("ansattValg").value;
  const dato = document.getElementById("dato").value;
  const startTid = document.getElementById("startTid").value;
  const sluttTid = document.getElementById("sluttTid").value;

  const timepris = Number(document.getElementById("timepris").value || 0);
  const km = Number(document.getElementById("km").value || 0);
  const kmPris = Number(document.getElementById("kmPris").value || 0);
  const diett = Number(document.getElementById("diett").value || 0);
  const tillegg = hentTilleggSum();
  const fakturerbar = document.getElementById("fakturerbar").checked;
  const beskrivelse = document.getElementById("beskrivelse").value.trim();

  if (!kundeId) return alert("Velg kunde");
  if (!ansattId) return alert("Velg ansatt");
  if (!dato) return alert("Velg dato");
  if (!startTid || !sluttTid) return alert("Fyll inn starttid og sluttid");

  const erDobbel = await finnesDobbelTimer(ansattId, kundeId, dato, startTid, sluttTid);

  if (erDobbel) {
    alert("Denne ansatte har allerede registrert timer samme dato, tid og kunde.");
    return;
  }

  const b = beregnTimer(startTid, sluttTid);

  const sum =
    b.timer * timepris +
    b.overtid50 * timepris * 0.5 +
    b.overtid100 * timepris +
    km * kmPris +
    diett +
    tillegg;

  const { error } = await supabaseClient
    .from("timer")
    .insert([{
      kunde_id: Number(kundeId),
      ansatt_id: ansattId,
      dato,
      start_tid: startTid,
      slutt_tid: sluttTid,
      timepris,
      km,
      km_pris: kmPris,
      diett,
      andre_tillegg: tillegg,
      fakturerbar,
      beskrivelse,
      timer: b.timer,
      overtid_50: b.overtid50,
      overtid_100: b.overtid100,
      sum
    }]);

  if (error) {
  if (error.code === "23505") {
    alert("Denne timen er allerede registrert for samme ansatt, kunde, dato og tid.");
  } else {
    alert("Feil ved lagring av timer: " + error.message);
  }
  return;
}
  alert("Timer lagret i databasen");

  nullstillTimerSkjema();
  await lastTimer();
}

function visTimer() {
  const tbody = document.getElementById("timerTabell");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!timer || timer.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12">Ingen timer registrert.</td>
      </tr>
    `;
    return;
  }

  timer.forEach(t => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.dato || ""}</td>
      <td>${t.kunder?.navn || ""}</td>
      <td>${t.ansatte?.navn || ""}</td>
      <td>${t.start_tid || ""}</td>
      <td>${t.slutt_tid || ""}</td>
      <td>${t.timer || 0}</td>
      <td>50: ${t.overtid_50 || 0}<br>100: ${t.overtid_100 || 0}</td>
      <td>${t.km || 0}</td>
      <td>${t.diett || 0}</td>
      <td>${t.andre_tillegg || 0}</td>
      <td>${Number(t.sum || 0).toFixed(2)}</td>
      <td>${t.fakturerbar ? "Ja" : "Nei"}</td>
    `;

    tbody.appendChild(tr);
  });
}

function nullstillTimerSkjema() {
  document.getElementById("dato").value = datoIDag();
  document.getElementById("startTid").value = "";
  document.getElementById("sluttTid").value = "";
  document.getElementById("km").value = "0";
  document.getElementById("diett").value = "0";
  document.getElementById("tilleggListe").innerHTML = "";
  document.getElementById("tilleggTekst").value = "";
  document.getElementById("tilleggBelop").value = "";
  document.getElementById("beskrivelse").value = "";
}

window.timer = timer;
window.lastTimer = lastTimer;
window.lagreTimer = lagreTimer;
window.visTimer = visTimer;
window.beregnTimer = beregnTimer;
window.leggTilTillegg = leggTilTillegg;
window.finnesDobbelTimer = finnesDobbelTimer;
window.lagreTimer = lagreTimer;