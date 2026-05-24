console.log("NY app.js er lastet");

function koble(id, event, funksjon) {
  const element = document.getElementById(id);

  if (!element) {
    console.warn("Fant ikke element:", id);
    return;
  }

  if (typeof funksjon !== "function") {
    console.warn("Fant ikke funksjon for:", id);
    return;
  }

  element.addEventListener(event, funksjon);
}

function tryggFunksjon(navn) {
  return typeof window[navn] === "function" ? window[navn] : undefined;
}

koble("loginKnapp", "click", tryggFunksjon("loggInn"));
koble("glemtPassordKnapp", "click", tryggFunksjon("glemtPassord"));
koble("lagreNyttPassordKnapp", "click", tryggFunksjon("lagreNyttPassord"));
koble("tilbakeTilLoginKnapp", "click", tryggFunksjon("visLogin"));
koble("loggUtKnapp", "click", tryggFunksjon("loggUt"));

koble("visTimerKnapp", "click", tryggFunksjon("visTimerSide"));
koble("visKundeKnapp", "click", tryggFunksjon("visKundeSide"));
koble("visAnsattKnapp", "click", tryggFunksjon("visAnsattSide"));
koble("visFirmaKnapp", "click", tryggFunksjon("visFirmaSide"));

koble("leggTilKundeKnapp", "click", tryggFunksjon("lagreKunde"));
koble("tilbakeTilTimerKnapp", "click", tryggFunksjon("visTimerSide"));

koble("leggTilTrekkKnapp", "click", tryggFunksjon("leggTilTrekk"));
koble("lagreAnsattKnapp", "click", tryggFunksjon("lagreAnsatt"));
koble("tilbakeFraAnsattKnapp", "click", tryggFunksjon("visTimerSide"));

koble("lagreFirmaKnapp", "click", tryggFunksjon("lagreFirma"));
koble("firmaLogo", "change", tryggFunksjon("lastInnLogo"));
koble("tilbakeFraFirmaKnapp", "click", tryggFunksjon("visTimerSide"));

koble("lagreTimerKnapp", "click", tryggFunksjon("lagreTimer"));
koble("excelKnapp", "click", tryggFunksjon("eksporterMvaRegneark"));
koble("pdfKnapp", "click", tryggFunksjon("lagFakturaPdf"));
koble("kreditnotaKnapp", "click", tryggFunksjon("visKreditnotaPrompt"));
koble("backupKnapp", "click", tryggFunksjon("backup"));

const importFil = document.getElementById("importFil");
if (importFil && typeof window.importerBackup === "function") {
  importFil.addEventListener("change", window.importerBackup);
}

const kundeValg = document.getElementById("kundeValg");
if (kundeValg && typeof window.visKundeNavn === "function") {
  kundeValg.addEventListener("change", window.visKundeNavn);
}

const startTidFelt = document.getElementById("startTid");
if (startTidFelt) {
  startTidFelt.addEventListener("change", () => {
    const sluttTid = document.getElementById("sluttTid");
    if (sluttTid) sluttTid.focus();
  });
}

if (typeof supabaseClient !== "undefined") {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    window.innloggetBruker = session && session.user ? session.user : window.innloggetBruker || null;

    if (event === "PASSWORD_RECOVERY") {
      visNyttPassord();
    }
  });
}

function startApp() {
  console.log("Starter app");
  visLogin();
}

startApp();
async function stressTest() {
  const behold = "greknuts@online.no";

  const testEposter = [
    "kurs@jobbsmartkurs.no",
    "lykke@jobbsmartkurs.no",
    "rotern@jobbsmartkurs.no",
    "taxi@jobbsmartkurs.no",
    "tulling@jobbsmartkurs.no",
    "annegrethek@hotmail.com"
  ];

  console.log("Starter stresstest...");

  // 1. SLETT TIMER
  await supabaseClient.from("timer").delete().neq("id", 0);

  // 2. SLETT ANSATTE (unntatt admin)
  await supabaseClient
    .from("ansatte")
    .delete()
    .neq("epost", behold);

  console.log("Gamle data slettet");

  // 3. LEGG INN ANSATTE
  for (let epost of testEposter) {
    await supabaseClient.from("ansatte").insert({
      navn: epost.split("@")[0],
      epost: epost,
      timepris: 1100
    });
  }

  console.log("Ansatte opprettet");

  // 4. LAG KUNDER
  for (let i = 1; i <= 10; i++) {
    await supabaseClient.from("kunder").insert({
      navn: "TEST_KUNDE_" + i,
      epost: "kunde" + i + "@test.no"
    });
  }

  console.log("Kunder opprettet");

  // 5. HENT DATA
  const { data: ansatte } = await supabaseClient.from("ansatte").select("*");
  const { data: kunder } = await supabaseClient.from("kunder").select("*");

  // 6. LAG TIMER (MYE DATA)
  for (let i = 0; i < 200; i++) {
    const ansatt = ansatte[Math.floor(Math.random() * ansatte.length)];
    const kunde = kunder[Math.floor(Math.random() * kunder.length)];

    await supabaseClient.from("timer").insert({
      ansatt_id: ansatt.id,
      kunde_id: kunde.id,
      dato: "2026-05-01",
      timer: Math.random() * 8,
      beskrivelse: "TEST",
      fakturerbar: "ja"
    });
  }

  console.log("Timer opprettet");

  alert("Stresstest ferdig 🚀");
}
