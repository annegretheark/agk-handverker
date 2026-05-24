function koble(id, event, funksjonsNavn) {
  const element = document.getElementById(id);

  if (!element) {
    console.warn("Fant ikke element:", id);
    return;
  }

  const funksjon = window[funksjonsNavn];

  if (typeof funksjon !== "function") {
    console.warn("Fant ikke funksjon:", funksjonsNavn);
    return;
  }

  element.addEventListener(event, funksjon);
}

koble("loginKnapp", "click", "loggInn");
koble("glemtPassordKnapp", "click", "glemtPassord");
koble("lagreNyttPassordKnapp", "click", "lagreNyttPassord");
koble("tilbakeTilLoginKnapp", "click", "visLogin");
koble("loggUtKnapp", "click", "loggUt");

koble("visTimerKnapp", "click", "visTimerSide");
koble("visKundeKnapp", "click", "visKundeSide");
koble("visAnsattKnapp", "click", "visAnsattSide");
koble("visFirmaKnapp", "click", "visFirmaSide");

koble("leggTilKundeKnapp", "click", "lagreKunde");
koble("tilbakeTilTimerKnapp", "click", "visTimerSide");

koble("leggTilTrekkKnapp", "click", "leggTilTrekk");
koble("lagreAnsattKnapp", "click", "lagreAnsatt");
koble("tilbakeFraAnsattKnapp", "click", "visTimerSide");

koble("lagreFirmaKnapp", "click", "lagreFirma");
koble("tilbakeFraFirmaKnapp", "click", "visTimerSide");

koble("lagreTimerKnapp", "click", "lagreTimer");
koble("backupKnapp", "click", "backup");

const firmaLogo = document.getElementById("firmaLogo");
if (firmaLogo && typeof lastInnLogo === "function") {
  firmaLogo.addEventListener("change", lastInnLogo);
}

const pdfKnapp = document.getElementById("pdfKnapp");
if (pdfKnapp) {
  pdfKnapp.addEventListener("click", () => window.print());
}

const kundeValg = document.getElementById("kundeValg");
if (kundeValg && typeof visKundeNavn === "function") {
  kundeValg.addEventListener("change", visKundeNavn);
}

const startTidFelt = document.getElementById("startTid");
if (startTidFelt) {
  startTidFelt.addEventListener("change", () => {
    const sluttTid = document.getElementById("sluttTid");
    if (sluttTid) sluttTid.focus();
  });
}

function startApp() {
  console.log("App starter");
  if (typeof visLogin === "function") {
    visLogin();
  }
}

startApp();