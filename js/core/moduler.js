console.log("moduler.js lastet");

window.AGK_MODULER = {};

async function lastModulerFraDatabase() {

  const { data, error } =
    await supabaseClient
      .from("moduler")
      .select("*");

  if (error) {
    console.error(error);
    return;
  }

  window.AGK_MODULER = {};

  for (const modul of data) {

    window.AGK_MODULER[
      modul.navn
    ] = modul.aktiv;

  }

  if (
    typeof oppdaterModulVisning ===
    "function"
  ) {
    oppdaterModulVisning();
  }
}

function modulAktiv(navn) {

  return !!window.AGK_MODULER[navn];

}

window.modulAktiv = modulAktiv;

window.lastModulerFraDatabase =
  lastModulerFraDatabase;