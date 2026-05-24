let innloggetBruker = null;
let innloggetAnsatt = null;
let erAdmin = false;

let kunder = [];
let ansatte = [];
let timer = [];

document.addEventListener("DOMContentLoaded", async () => {
  settDagensDato();
  kobleBeregning();

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    visLogin();
    return;
  }

  if (data.session) {
    innloggetBruker = data.session.user;
    await etterInnlogging("bruker");
  } else {
    visLogin();
  }
});

function settDagensDato() {
  const felt = document.getElementById("timeDato");
  if (felt && !felt.value) felt.value = new Date().toISOString().slice(0, 10);
}

function kobleBeregning() {
  ["timeStart", "timeSlutt", "timePris", "timeKm", "timeKmPris"].forEach(id => {
    const felt = document.getElementById(id);
    if (felt) felt.addEventListener("input", visBeregning);
  });

  const start = document.getElementById("timeStart");
  const slutt = document.getElementById("timeSlutt");

  if (start && slutt) {
    start.addEventListener("change", () => {
      if (start.value) slutt.focus();
    });
  }
}

async function loggInn() {
  const email = document.getElementById("loginEpost").value.trim().toLowerCase();
  const password = document.getElementById("loginPassord").value;
  const valgtRolle = document.querySelector("input[name='loginRolle']:checked").value;

  if (!email || !password) {
    alert("Skriv inn e-post og passord.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Feil ved innlogging: " + error.message);
    return;
  }

  innloggetBruker = data.user;
  await etterInnlogging(valgtRolle);
}

async function etterInnlogging(valgtRolle) {
  await hentAnsattProfil();

  if (!innloggetAnsatt) {
    alert("Bruker finnes ikke i ansatte-tabellen: " + innloggetBruker.email);
    await supabaseClient.auth.signOut();
    visLogin();
    return;
  }

  erAdmin = String(innloggetAnsatt.rolle || "").trim().toLowerCase() === "admin";

  if (valgtRolle === "admin" && !erAdmin) {
    alert("Denne brukeren finnes, men har ikke rolle admin.");
    await supabaseClient.auth.signOut();
    visLogin();
    return;
  }

  visApp();

  await lastKunder();
  await lastAnsatte();
  await lastTimer();
}

async function hentAnsattProfil() {
  const email = String(innloggetBruker.email || "").trim().toLowerCase();

  const { data, error } = await supabaseClient
    .from("ansatte")
    .select("*")
    .ilike("epost", email)
    .maybeSingle();

  if (error) {
    alert("Feil ved henting av ansatt: " + error.message);
    innloggetAnsatt = null;
    return;
  }

  innloggetAnsatt = data;
}

function visLogin() {
  document.getElementById("loginSide").classList.remove("hidden");
  document.getElementById("appSide").classList.add("hidden");
}

function visApp() {
  document.getElementById("loginSide").classList.add("hidden");
  document.getElementById("appSide").classList.remove("hidden");

  document.getElementById("innloggetInfo").innerText =
    `Innlogget: ${innloggetBruker.email} (${erAdmin ? "admin" : "bruker"})`;

  document.getElementById("adminKnapp").style.display = erAdmin ? "inline-block" : "none";
  visSide("timerSide");
}

function visSide(sideId) {
  ["timerSide", "kundeSide", "ansattSide"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });

  if (sideId === "ansattSide" && !erAdmin) {
    alert("Bare admin kan åpne ansatte.");
    return;
  }

  document.getElementById(sideId).classList.remove("hidden");
}

async function loggUt() {
  await supabaseClient.auth.signOut();
  innloggetBruker = null;
  innloggetAnsatt = null;
  erAdmin = false;
  visLogin();
}

async function glemtPassord() {
  const email = document.getElementById("loginEpost").value.trim().toLowerCase();

  if (!email) {
    alert("Skriv inn e-post først.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost/NyTimherdelt/reset.html"
  });

  if (error) {
    alert("Feil ved glemt passord: " + error.message);
    return;
  }

  alert("Hvis brukeren finnes, er lenke sendt.");
}

/* BEREGNING */

function beregnTimer() {
  const start = document.getElementById("timeStart").value;
  const slutt = document.getElementById("timeSlutt").value;
  const pris = Number(document.getElementById("timePris").value || 0);
  const km = Number(document.getElementById("timeKm").value || 0);
  const kmPris = Number(document.getElementById("timeKmPris").value || 0);

  if (!start || !slutt) {
    return {
      timerNormal: 0,
      timer50: 0,
      timer100: 0,
      belopArbeid: 0,
      belopKjoring: km * kmPris,
      total: km * kmPris
    };
  }

  let startMin = tidTilMinutter(start);
  let sluttMin = tidTilMinutter(slutt);

  if (sluttMin <= startMin) sluttMin += 24 * 60;

  let normal = 0;
  let over50 = 0;
  let over100 = 0;

  for (let m = startMin; m < sluttMin; m += 15) {
    const klokke = m % (24 * 60);

    if (klokke >= 21 * 60 || klokke < 6 * 60) {
      over100 += 0.25;
    } else if (klokke >= 16 * 60) {
      over50 += 0.25;
    } else {
      normal += 0.25;
    }
  }

  const belopArbeid =
    normal * pris +
    over50 * pris * 1.5 +
    over100 * pris * 2;

  const belopKjoring = km * kmPris;

  return {
    timerNormal: normal,
    timer50: over50,
    timer100: over100,
    belopArbeid,
    belopKjoring,
    total: belopArbeid + belopKjoring
  };
}

function tidTilMinutter(tid) {
  const [h, m] = tid.split(":").map(Number);
  return h * 60 + m;
}

function visBeregning() {
  const div = document.getElementById("timeBeregning");
  if (!div) return;

  const b = beregnTimer();

  div.innerHTML = `
    Normal: ${b.timerNormal.toFixed(2)} t<br>
    Overtid 50 %: ${b.timer50.toFixed(2)} t<br>
    Overtid 100 %: ${b.timer100.toFixed(2)} t<br>
    Arbeid: ${b.belopArbeid.toFixed(2)} kr<br>
    Kjøring: ${b.belopKjoring.toFixed(2)} kr<br>
    <strong>Total: ${b.total.toFixed(2)} kr</strong>
  `;
}

/* KUNDER */

async function lastKunder() {
  const { data, error } = await supabaseClient
    .from("kunder")
    .select("*")
    .order("navn", { ascending: true });

  if (error) {
    alert("Feil ved henting av kunder: " + error.message);
    return;
  }

  kunder = data || [];
  fyllKundeDropdown();
  visKunder();
}

function fyllKundeDropdown() {
  const select = document.getElementById("timeKunde");
  select.innerHTML = "<option value=''>Velg kunde</option>";

  kunder.forEach(k => {
    const option = document.createElement("option");
    option.value = k.id;
    option.textContent = k.navn || "Uten navn";
    select.appendChild(option);
  });
}

async function lagreKunde() {
  const id = document.getElementById("kundeId").value;

  const kunde = {
    navn: document.getElementById("kundeNavn").value.trim(),
    adresse: document.getElementById("kundeAdresse").value.trim(),
    epost: document.getElementById("kundeEpost").value.trim(),
    kontaktperson: document.getElementById("kundeKontaktperson").value.trim(),
    telefon: document.getElementById("kundeTelefon").value.trim(),
    orgnr: document.getElementById("kundeOrgNr").value.trim()
  };

  if (!kunde.navn) {
    alert("Kundenavn må fylles ut.");
    return;
  }

  const result = id
    ? await supabaseClient.from("kunder").update(kunde).eq("id", id)
    : await supabaseClient.from("kunder").insert([kunde]);

  if (result.error) {
    alert("Feil ved lagring av kunde: " + result.error.message);
    return;
  }

  nullstillKunde();
  await lastKunder();
}

function visKunder() {
  const div = document.getElementById("kundeListe");

  if (!kunder.length) {
    div.innerHTML = "<p>Ingen kunder registrert.</p>";
    return;
  }

  div.innerHTML = `
    <table>
      <tr>
        <th>Navn</th><th>E-post</th><th>Telefon</th><th>Kontakt</th><th></th>
      </tr>
      ${kunder.map(k => `
        <tr>
          <td>${k.navn || ""}</td>
          <td>${k.epost || ""}</td>
          <td>${k.telefon || ""}</td>
          <td>${k.kontaktperson || ""}</td>
          <td>
            <button onclick="redigerKunde('${k.id}')">Rediger</button>
            <button class="danger" onclick="slettKunde('${k.id}')">Slett</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

function redigerKunde(id) {
  const k = kunder.find(x => String(x.id) === String(id));
  if (!k) return;

  document.getElementById("kundeId").value = k.id || "";
  document.getElementById("kundeNavn").value = k.navn || "";
  document.getElementById("kundeAdresse").value = k.adresse || "";
  document.getElementById("kundeEpost").value = k.epost || "";
  document.getElementById("kundeKontaktperson").value = k.kontaktperson || "";
  document.getElementById("kundeTelefon").value = k.telefon || "";
  document.getElementById("kundeOrgNr").value = k.orgnr || "";
}

async function slettKunde(id) {
  if (!confirm("Slette kunde?")) return;

  const { error } = await supabaseClient.from("kunder").delete().eq("id", id);

  if (error) {
    alert("Feil ved sletting: " + error.message);
    return;
  }

  await lastKunder();
}

function nullstillKunde() {
  ["kundeId", "kundeNavn", "kundeAdresse", "kundeEpost", "kundeKontaktperson", "kundeTelefon", "kundeOrgNr"]
    .forEach(id => document.getElementById(id).value = "");
}

/* ANSATTE */

async function lastAnsatte() {
  if (!erAdmin) return;

  const { data, error } = await supabaseClient
    .from("ansatte")
    .select("*")
    .order("navn", { ascending: true });

  if (error) {
    alert("Feil ved henting av ansatte: " + error.message);
    return;
  }

  ansatte = data || [];
  visAnsatte();
}

async function lagreAnsatt() {
  if (!erAdmin) {
    alert("Bare admin kan lagre ansatte.");
    return;
  }

  const id = document.getElementById("ansattId").value;

  const ansatt = {
    navn: document.getElementById("ansattNavn").value.trim(),
    epost: document.getElementById("ansattEpost").value.trim().toLowerCase(),
    telefon: document.getElementById("ansattTelefon").value.trim(),
    personnr: document.getElementById("ansattPersonnr").value.trim(),
    trekk: Number(document.getElementById("ansattTrekk").value || 0),
    rolle: document.getElementById("ansattRolle").value
  };

  if (!ansatt.navn || !ansatt.epost) {
    alert("Navn og e-post må fylles ut.");
    return;
  }

  const result = id
    ? await supabaseClient.from("ansatte").update(ansatt).eq("id", id)
    : await supabaseClient.from("ansatte").insert([ansatt]);

  if (result.error) {
    alert("Feil ved lagring av ansatt: " + result.error.message);
    return;
  }

  nullstillAnsatt();
  await lastAnsatte();
}

function visAnsatte() {
  const div = document.getElementById("ansattListe");

  if (!ansatte.length) {
    div.innerHTML = "<p>Ingen ansatte registrert.</p>";
    return;
  }

  div.innerHTML = `
    <table>
      <tr>
        <th>Navn</th><th>E-post</th><th>Telefon</th><th>Rolle</th><th>Trekk</th><th></th>
      </tr>
      ${ansatte.map(a => `
        <tr>
          <td>${a.navn || ""}</td>
          <td>${a.epost || ""}</td>
          <td>${a.telefon || ""}</td>
          <td>${a.rolle || ""}</td>
          <td>${a.trekk || 0}</td>
          <td>
            <button onclick="redigerAnsatt('${a.id}')">Rediger</button>
            <button class="danger" onclick="slettAnsatt('${a.id}')">Slett</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

function redigerAnsatt(id) {
  const a = ansatte.find(x => String(x.id) === String(id));
  if (!a) return;

  document.getElementById("ansattId").value = a.id || "";
  document.getElementById("ansattNavn").value = a.navn || "";
  document.getElementById("ansattEpost").value = a.epost || "";
  document.getElementById("ansattTelefon").value = a.telefon || "";
  document.getElementById("ansattPersonnr").value = a.personnr || "";
  document.getElementById("ansattTrekk").value = a.trekk || 0;
  document.getElementById("ansattRolle").value = a.rolle || "bruker";
}

async function slettAnsatt(id) {
  if (!erAdmin) return alert("Bare admin kan slette ansatte.");
  if (!confirm("Slette ansatt?")) return;

  const { error } = await supabaseClient.from("ansatte").delete().eq("id", id);

  if (error) {
    alert("Feil ved sletting av ansatt: " + error.message);
    return;
  }

  await lastAnsatte();
}

function nullstillAnsatt() {
  document.getElementById("ansattId").value = "";
  document.getElementById("ansattNavn").value = "";
  document.getElementById("ansattEpost").value = "";
  document.getElementById("ansattTelefon").value = "";
  document.getElementById("ansattPersonnr").value = "";
  document.getElementById("ansattTrekk").value = "0";
  document.getElementById("ansattRolle").value = "bruker";
}

async function sendPassordlenkeTilAnsatt() {
  const email = document.getElementById("ansattEpost").value.trim().toLowerCase();

  if (!email) {
    alert("Fyll ut e-post på ansatt først.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost/NyTimherdelt/reset.html"
  });

  if (error) {
    alert("Feil ved sending: " + error.message);
    return;
  }

  alert("Passordlenke sendt hvis brukeren finnes.");
}

/* TIMER */

async function lastTimer() {
  let query = supabaseClient
    .from("timer")
    .select("*")
    .order("dato", { ascending: false });

  if (!erAdmin) {
    query = query.eq("ansatt_epost", innloggetBruker.email);
  }

  const { data, error } = await query;

  if (error) {
    alert("Feil ved henting av timer: " + error.message);
    return;
  }

  timer = data || [];
  visTimer();
}

async function lagreTimer() {
  const kundeId = document.getElementById("timeKunde").value;
  const dato = document.getElementById("timeDato").value;
  const start = document.getElementById("timeStart").value;
  const slutt = document.getElementById("timeSlutt").value;

  if (!kundeId || !dato || !start || !slutt) {
    alert("Kunde, dato, start og slutt må fylles ut.");
    return;
  }

  const finnes = timer.some(t =>
    String(t.kunde_id) === String(kundeId) &&
    String(t.ansatt_epost).toLowerCase() === innloggetBruker.email.toLowerCase() &&
    t.dato === dato &&
    t.start === start &&
    t.slutt === slutt
  );

  if (finnes) {
    alert("Denne timen er allerede registrert.");
    return;
  }

  const b = beregnTimer();

  const nyTime = {
    kunde_id: kundeId,
    ansatt_epost: innloggetBruker.email,
    dato,
    start,
    slutt,
    timepris: Number(document.getElementById("timePris").value || 1100),
    km: Number(document.getElementById("timeKm").value || 0),
    kmpris: Number(document.getElementById("timeKmPris").value || 0),
    reise: document.getElementById("timeReise").checked,
    fakturerbar: document.getElementById("timeFakturerbar").checked,
    beskrivelse: document.getElementById("timeBeskrivelse").value.trim(),
    timer_normal: b.timerNormal,
    timer_50: b.timer50,
    timer_100: b.timer100,
    belop_arbeid: b.belopArbeid,
    belop_kjoring: b.belopKjoring,
    total: b.total
  };

  const { error } = await supabaseClient.from("timer").insert([nyTime]);

  if (error) {
    alert("Feil ved lagring av timer: " + error.message);
    return;
  }

  nullstillTimer();
  await lastTimer();
}

function nullstillTimer() {
  document.getElementById("timeId").value = "";
  document.getElementById("timeKunde").value = "";
  document.getElementById("timeDato").value = new Date().toISOString().slice(0, 10);
  document.getElementById("timeStart").value = "";
  document.getElementById("timeSlutt").value = "";
  document.getElementById("timePris").value = "1100";
  document.getElementById("timeKm").value = "0";
  document.getElementById("timeKmPris").value = "4.90";
  document.getElementById("timeFakturerbar").checked = true;
  document.getElementById("timeReise").checked = false;
  document.getElementById("timeBeskrivelse").value = "";
  visBeregning();
}

function visTimer() {
  const div = document.getElementById("timerListe");

  if (!timer.length) {
    div.innerHTML = "<p>Ingen timer registrert.</p>";
    return;
  }

  div.innerHTML = `
    <table>
      <tr>
        <th>Dato</th><th>Kunde</th><th>Start</th><th>Slutt</th>
        <th>Normal</th><th>50%</th><th>100%</th><th>Total</th><th>Beskrivelse</th>
      </tr>
      ${timer.map(t => {
        const kunde = kunder.find(k => String(k.id) === String(t.kunde_id));
        return `
          <tr>
            <td>${t.dato || ""}</td>
            <td>${kunde ? kunde.navn : ""}</td>
            <td>${t.start || ""}</td>
            <td>${t.slutt || ""}</td>
            <td>${Number(t.timer_normal || 0).toFixed(2)}</td>
            <td>${Number(t.timer_50 || 0).toFixed(2)}</td>
            <td>${Number(t.timer_100 || 0).toFixed(2)}</td>
            <td>${Number(t.total || 0).toFixed(2)}</td>
            <td>${t.beskrivelse || ""}</td>
          </tr>
        `;
      }).join("")}
    </table>
  `;
}

/* GLOBALT */

window.loggInn = loggInn;
window.loggUt = loggUt;
window.glemtPassord = glemtPassord;
window.visSide = visSide;

window.lagreKunde = lagreKunde;
window.nullstillKunde = nullstillKunde;
window.redigerKunde = redigerKunde;
window.slettKunde = slettKunde;

window.lagreAnsatt = lagreAnsatt;
window.nullstillAnsatt = nullstillAnsatt;
window.redigerAnsatt = redigerAnsatt;
window.slettAnsatt = slettAnsatt;
window.sendPassordlenkeTilAnsatt = sendPassordlenkeTilAnsatt;

window.lagreTimer = lagreTimer;
window.nullstillTimer = nullstillTimer;
window.loggInn = loggInn;
window.glemtPassord = glemtPassord;
window.lagreNyttPassord = lagreNyttPassord;
window.loggUt = loggUt;