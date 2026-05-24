let innloggetEpost = "";
let innloggetAnsattId = "";
window.innloggetAnsattId = "";

function skjulForVanligBruker() {

  const skjulKnapper = [
    "visKundeKnapp",
    "visAnsattKnapp",
    "visFirmaKnapp",
    "visTestKnapp",
    "excelKnapp",
    "pdfKnapp",
    "backupKnapp",
    "kreditnotaKnapp",
    "importFil"
  ];

  skjulKnapper.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.style.display = "none";
    }
  });

  const lonnPanel =
    document.getElementById("lonnPanel");

  if (lonnPanel) {
    lonnPanel.style.display = "none";
  }

  const sider = [
    "kundeSide",
    "ansattSide",
    "firmaSide",
    "testSide"
  ];

  sider.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.classList.add("skjult");
    }
  });
}

function visAltForAdmin() {

  const visKnapper = [
    "visKundeKnapp",
    "visAnsattKnapp",
    "visFirmaKnapp",
    "visTestKnapp",
    "excelKnapp",
    "pdfKnapp",
    "backupKnapp",
    "kreditnotaKnapp",
    "importFil"
  ];

  visKnapper.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.style.display = "";
    }
  });

  const lonnPanel =
    document.getElementById("lonnPanel");

  if (lonnPanel) {
    lonnPanel.style.display = "";
  }
}

async function loggInn() {
  const loginMelding = document.getElementById("loginMelding");
  loginMelding.textContent = "";

  const email = document.getElementById("loginEpost").value.trim().toLowerCase();
  const password = document.getElementById("loginPassord").value;
  const vilAdmin = document.getElementById("loginSomAdmin")?.checked === true;

  if (!email || !password) {
    loginMelding.textContent = "Skriv inn e-post og passord.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMelding.textContent =
      "Innlogging feilet: " + error.message;

    return;
  }

  innloggetEpost = email;
  window.innloggetEpost = email;

  innloggetAnsattId = "";
  window.innloggetAnsattId = "";

  erAdmin = false;

  if (vilAdmin && email === "greknuts@online.no") {
    erAdmin = true;
  }

  const {
    data: ansattRader,
    error: ansattError
  } = await supabaseClient
    .from("ansatte")
    .select("*")
    .eq("epost", email)
    .limit(1);

  if (ansattError) {

    console.error(
      "Feil ved henting av innlogget ansatt:",
      ansattError
    );

    loginMelding.textContent =
      "Innlogging ok, men kunne ikke hente ansattdata: " +
      ansattError.message;

    await supabaseClient.auth.signOut();

    return;
  }

  const ansattData =
    Array.isArray(ansattRader) &&
    ansattRader.length
      ? ansattRader[0]
      : null;

  if (ansattData && ansattData.id) {
    innloggetAnsattId = ansattData.id;
    window.innloggetAnsattId = ansattData.id;
  }

  if (vilAdmin && !erAdmin) {

    if (
      ansattData &&
      String(ansattData.rolle).toLowerCase() === "admin"
    ) {
      erAdmin = true;
    }
  }

  const maaByttePassord =
    ansattData &&
    ansattData.ma_bytte_passord === true;

  if (maaByttePassord) {

    visNyttPassord();

    const melding =
      document.getElementById("nyttPassordMelding");

    if (melding) {
      melding.textContent =
        "Du må lage et nytt passord før du kan bruke systemet.";
    }

    return;
  }

  visApp();

  if (erAdmin) {
    visAltForAdmin();
  } else {
    skjulForVanligBruker();
  }

  if (typeof visTimerSide === "function") {
    visTimerSide();
  }
}

async function loggUt() {

  await supabaseClient.auth.signOut();

  document.getElementById("loginPassord").value = "";

  erAdmin = false;

  innloggetEpost = "";
  innloggetAnsattId = "";

  window.innloggetEpost = "";
  window.innloggetAnsattId = "";

  visLogin();
}

async function glemtPassord() {

  const loginMelding =
    document.getElementById("loginMelding");

  loginMelding.textContent = "";

  const email =
    document.getElementById("loginEpost")
      .value
      .trim()
      .toLowerCase();

  if (!email) {

    loginMelding.textContent =
      "Skriv inn e-postadressen først.";

    return;
  }

  const redirectUrl =
  window.location.origin +
  "/NyTimerdelt/reset.html";

  const { error } =
    await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectUrl
      }
    );

  if (error) {

    loginMelding.textContent =
      "Kunne ikke sende e-post: " +
      error.message;

    return;
  }

  loginMelding.textContent =
    "E-post for tilbakestilling av passord er sendt.";
}

async function lagreNyttPassord() {

  const melding =
    document.getElementById("nyttPassordMelding");

  const passord1 =
    document.getElementById("nyttPassord").value;

  const passord2 =
    document.getElementById("gjentaNyttPassord").value;

  melding.textContent = "";

  if (!passord1 || !passord2) {

    melding.textContent =
      "Skriv inn nytt passord to ganger.";

    return;
  }

  if (passord1 !== passord2) {

    melding.textContent =
      "Passordene er ikke like.";

    return;
  }

  const { error } =
    await supabaseClient.auth.updateUser({
      password: passord1
    });

  if (error) {

    melding.textContent =
      "Kunne ikke oppdatere passord: " +
      error.message;

    return;
  }

  if (innloggetEpost) {

    const { error: ansattError } =
      await supabaseClient
        .from("ansatte")
        .update({
          ma_bytte_passord: false
        })
        .eq("epost", innloggetEpost);

    if (ansattError) {

      console.error(
        "Passord ble endret, men flagg ble ikke oppdatert:",
        ansattError
      );

      melding.textContent =
        "Passordet ble endret, men appen fikk ikke oppdatert ansattregisteret: " +
        ansattError.message;

      return;
    }
  }

  melding.textContent =
    "Passordet er endret. Logg inn på nytt.";

  await supabaseClient.auth.signOut();

  innloggetEpost = "";
  innloggetAnsattId = "";

  window.innloggetEpost = "";
  window.innloggetAnsattId = "";

  visLogin();
}

window.loggInn = loggInn;
window.loggUt = loggUt;
window.glemtPassord = glemtPassord;
window.lagreNyttPassord = lagreNyttPassord;