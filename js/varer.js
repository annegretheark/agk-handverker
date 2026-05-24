function visVarer() {
  const prosjektOverlay = document.getElementById("prosjektOverlay");
  if (prosjektOverlay) prosjektOverlay.style.display = "none";

  const prosjektVindu = document.getElementById("prosjektVindu");
  if (prosjektVindu) prosjektVindu.style.display = "none";

  const sider = [
    "timerSide",
    "lonnPanel",
    "kundeSide",
    "ansattSide",
    "firmaSide",
    "testSide"
  ];

  sider.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("skjult");
  });

  const varerSide = document.getElementById("varerSide");

  if (!varerSide) {
    alert("Finner ikke varerSide i index.html");
    return;
  }

  varerSide.classList.remove("skjult");

  hentVarer();
}

function tilbakeFraVarer() {
  const varerSide = document.getElementById("varerSide");
  if (varerSide) varerSide.classList.add("skjult");

  const timerSide = document.getElementById("timerSide");
  if (timerSide) timerSide.classList.remove("skjult");
}

async function hentVarer() {
  const liste = document.getElementById("vareListe");
  if (!liste) return;

  liste.innerHTML = "Laster varer...";

  const { data, error } = await supabaseClient
    .from("varer")
    .select("*")
    .order("varenr", { ascending: true });

  if (error) {
    liste.innerHTML = "Feil ved henting: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    liste.innerHTML = "Ingen varer registrert.";
    return;
  }

  liste.innerHTML = data.map(v => `
    <div style="
      border:1px solid #ccc;
      padding:10px;
      margin-bottom:10px;
      border-radius:8px;
      background:#fff;
    ">
      <b>${v.varenr || ""} ${v.navn || ""}</b><br>
      ${v.beskrivelse || ""}<br><br>
      Pris: ${Number(v.pris || 0).toFixed(2)} kr eks mva<br>
      MVA: ${Number(v.mva_sats || 0)} %
    </div>
  `).join("");
}

async function fyllVarevalg() {
  const valg = document.getElementById("vareValg");
  if (!valg) return;

  valg.innerHTML = `<option value="">Ingen vare</option>`;

  const { data, error } = await supabaseClient
    .from("varer")
    .select("id, varenr, navn, pris")
    .order("varenr", { ascending: true });

  if (error) {
    console.error("Feil ved henting av varer til timer:", error);
    return;
  }

  (data || []).forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.dataset.pris = v.pris || 0;
    option.textContent =
      `${v.varenr || ""} ${v.navn || ""} - ${Number(v.pris || 0).toFixed(2)} kr`;

    valg.appendChild(option);
  });

  valg.onchange = function () {
    const valgtOption = valg.options[valg.selectedIndex];
    const pris = valgtOption ? valgtOption.dataset.pris : "";

    
    const prisFelt = document.getElementById("varePris");
    if (prisFelt && pris !== undefined && pris !== "") {
      prisFelt.value = pris;
    }
  };
}

async function lagreVare() {
  const varenr = document.getElementById("varenr").value.trim();
  const navn = document.getElementById("varenavn").value.trim();
  const beskrivelse = document.getElementById("varebeskrivelse").value.trim();
  const pris = Number(document.getElementById("varepris").value || 0);
  const mva_sats = Number(document.getElementById("varemva").value || 25);

  if (!navn) {
    alert("Du må skrive varenavn");
    return;
  }

  const { error } = await supabaseClient
    .from("varer")
    .insert([
      {
        varenr,
        navn,
        beskrivelse,
        pris,
        mva_sats,
        aktiv: true
      }
    ]);

  if (error) {
    alert("Feil ved lagring: " + error.message);
    return;
  }

  document.getElementById("varenr").value = "";
  document.getElementById("varenavn").value = "";
  document.getElementById("varebeskrivelse").value = "";
  document.getElementById("varepris").value = "";
  document.getElementById("varemva").value = "25";

  await hentVarer();
  await fyllVarevalg();
}

async function importerVarer() {
  const filInput = document.getElementById("importVarerFil");

  if (!filInput || !filInput.files.length) {
    alert("Velg Excel-fil");
    return;
  }

  const fil = filInput.files[0];
  const reader = new FileReader();

  reader.onload = async function(e) {
    const data = new Uint8Array(e.target.result);

    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    if (!json.length) {
      alert("Fant ingen varer i filen");
      return;
    }

    const varer = json
      .map(v => ({
        varenr: String(v.varenr || "").trim(),
        navn: String(v.navn || "").trim(),
        beskrivelse: String(v.beskrivelse || "").trim(),
        pris: Number(v.pris || 0),
        mva_sats: Number(v.mva_sats || 25),
        aktiv: true
      }))
      .filter(v => v.navn);

    if (!varer.length) {
      alert("Fant ingen varer med navn i filen");
      return;
    }

    const { error } = await supabaseClient
      .from("varer")
      .insert(varer);

    if (error) {
      alert("Importfeil: " + error.message);
      return;
    }

    alert("Importerte " + varer.length + " varer");

    await hentVarer();
    await fyllVarevalg();
  };

  reader.readAsArrayBuffer(fil);
}

document.addEventListener("DOMContentLoaded", () => {
  const varerKnapp = document.getElementById("varerKnapp");
  const lagreVareKnapp = document.getElementById("lagreVareKnapp");
  const tilbakeFraVarerKnapp = document.getElementById("tilbakeFraVarerKnapp");
  const importVarerKnapp = document.getElementById("importVarerKnapp");

  if (varerKnapp) varerKnapp.addEventListener("click", visVarer);
  if (lagreVareKnapp) lagreVareKnapp.addEventListener("click", lagreVare);
  if (tilbakeFraVarerKnapp) tilbakeFraVarerKnapp.addEventListener("click", tilbakeFraVarer);
  if (importVarerKnapp) importVarerKnapp.addEventListener("click", importerVarer);

  fyllVarevalg();
});

window.visVarer = visVarer;
window.hentVarer = hentVarer;
window.fyllVarevalg = fyllVarevalg;