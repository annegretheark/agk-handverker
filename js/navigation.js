function visElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.remove("skjult");
  el.style.display = "";
}

function skjulElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.classList.add("skjult");
}

function visLogin() {
  visElement("loginSide");
  skjulElement("nyttPassordSide");
  skjulElement("appSide");
}

function visNyttPassord() {
  skjulElement("loginSide");
  visElement("nyttPassordSide");
  skjulElement("appSide");
}

async function visApp() {
  skjulElement("loginSide");
  skjulElement("nyttPassordSide");
  visElement("appSide");

  oppdaterAdminVisning();

  if (typeof lastKunder === "function") await lastKunder();
  if (typeof lastProsjekter === "function") await lastProsjekter();
  if (typeof lastAnsatte === "function") await lastAnsatte();
  if (typeof settDagensDato === "function") settDagensDato();
  if (typeof lastTimer === "function") await lastTimer();
  else if (typeof tegnTimer === "function") tegnTimer();
  if (typeof fyllFirmaSkjema === "function") fyllFirmaSkjema();
  if (typeof tegnFirmaInfo === "function") tegnFirmaInfo();

  visTimerSide();
}

function oppdaterAdminVisning() {
  document.querySelectorAll(".admin-only").forEach(element => {
    if (erAdmin) {
      element.classList.remove("hidden");
      element.classList.remove("skjult");
      element.style.display = "";
    } else {
      element.classList.add("hidden");
      element.classList.add("skjult");
      element.style.display = "none";
    }
  });
}

function skjulAlleSider() {
  skjulElement("timerSide");
  skjulElement("kundeSide");
  skjulElement("ansattSide");
  skjulElement("firmaSide");
  skjulElement("testSide");
  skjulElement("lonnPanel");
}

function visTimerSide() {
  skjulAlleSider();
  visElement("timerSide");
}

async function visKundeSide() {
  if (!erAdmin) {
    alert("Du har ikke tilgang til kunderegister.");
    return;
  }

  skjulAlleSider();
  visElement("kundeSide");

  if (typeof lastKunder === "function") await lastKunder();
}

async function visAnsattSide() {
  if (!erAdmin) {
    alert("Du har ikke tilgang til ansattregister.");
    return;
  }

  skjulAlleSider();
  visElement("ansattSide");

  if (typeof tegnTrekkListe === "function") tegnTrekkListe();
  if (typeof lastAnsatte === "function") await lastAnsatte();
}

function visFirmaSide() {
  if (!erAdmin) {
    alert("Du har ikke tilgang til firma.");
    return;
  }

  skjulAlleSider();
  visElement("firmaSide");

  if (typeof fyllFirmaSkjema === "function") fyllFirmaSkjema();
  if (typeof tegnFirmaInfo === "function") tegnFirmaInfo();
}
function visLonnSide() {
  if (!erAdmin) {
    alert("Du har ikke tilgang til lønn.");
    return;
  }

  skjulAlleSider();
  visElement("lonnPanel");
}

function visTestSide() {
  if (!erAdmin) {
    alert("Du har ikke tilgang til testpanel.");
    return;
  }

  skjulAlleSider();
  visElement("testSide");
}

window.visLogin = visLogin;
window.visNyttPassord = visNyttPassord;
window.visApp = visApp;
window.visTimerSide = visTimerSide;
window.visKundeSide = visKundeSide;
window.visAnsattSide = visAnsattSide;
window.visFirmaSide = visFirmaSide;
window.visTestSide = visTestSide;
window.visLonnSide = visLonnSide;
