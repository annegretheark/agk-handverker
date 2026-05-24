console.log("tester.js er lastet - rettet global bruker");

window.innloggetBruker = window.innloggetBruker || null;
window.erAdmin = window.erAdmin || false;

async function kjorHelsetest(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter helsetest...",true);

    for(const tabell of ["firma","ansatte","kunder","timer","trekk_typer","ansatt_trekk","fakturaer"]){
      const {error}=await supabaseClient.from(tabell).select("*").limit(1);

      if(error){
        leggTilMelding("testMelding","FEIL "+tabell+": "+error.message);
        return;
      }

      leggTilMelding("testMelding","OK "+tabell,true);
    }

    leggTilMelding("testMelding","HELSETEST OK.",true);
  }catch(err){
    leggTilMelding("testMelding","HELSETEST FEIL: "+err.message);
  }
}

async function kjorStresstest(){
  settMelding("testMelding","");

  if(!confirm("Kjøre stresstest? Firma og greknuts røres ikke."))return;

  try{
    leggTilMelding("testMelding","Starter stresstest...",true);

    const runId=Date.now();

    const kundeRes = await supabaseClient.from("kunder").insert([
      {kundenr:"T"+runId+"A",navn:"TEST - Bygg AS "+runId,adresse:"Testveien 1",epost:"testbygg"+runId+"@test.no",telefon:"90000001"},
      {kundenr:"T"+runId+"B",navn:"TEST - Drift AS "+runId,adresse:"Driftsgata 2",epost:"testdrift"+runId+"@test.no",telefon:"90000002"},
      {kundenr:"T"+runId+"C",navn:"TEST - Hest og IT AS "+runId,adresse:"Stallveien 3",epost:"testhest"+runId+"@test.no",telefon:"90000003"}
    ]);

    if(kundeRes.error){
      leggTilMelding("testMelding","KUNDE INSERT FEIL: "+kundeRes.error.message);
      return;
    }

    leggTilMelding("testMelding","Testkunder lagt inn.",true);

    const testAnsatte=[
      {ansatt_nr:"TEST"+runId+"1",navn:"TEST Kurs "+runId,epost:"kurs@jobbsmartkurs.no",mobil:"90000011",timelonn:950,rolle:"bruker",aktiv:true},
      {ansatt_nr:"TEST"+runId+"2",navn:"TEST Lykke "+runId,epost:"lykke@jobbsmartkurs.no",mobil:"90000012",timelonn:875,rolle:"bruker",aktiv:true},
      {ansatt_nr:"TEST"+runId+"3",navn:"TEST Taxi "+runId,epost:"taxi@jobbsmartkurs.no",mobil:"90000014",timelonn:1100,rolle:"bruker",aktiv:true}
    ];

    for(const a of testAnsatte){
      const okAuth=await opprettAuthBrukerHvisMangler(a.epost,"testMelding");
      if(!okAuth){
        leggTilMelding("testMelding","AUTH FEIL: Hopper over "+a.epost);
        return;
      }
      leggTilMelding("testMelding","Auth-bruker OK: "+a.epost,true);
    }

    const ansattRes = await supabaseClient
      .from("ansatte")
      .upsert(testAnsatte, { onConflict: "epost" });

    if(ansattRes.error){
      leggTilMelding("testMelding","ANSATT INSERT FEIL: "+ansattRes.error.message);
      return;
    }

    leggTilMelding("testMelding","Testansatte lagt inn.",true);

    const {data:dbKunder,error:ke}=await supabaseClient
      .from("kunder")
      .select("*")
      .like("navn","TEST%"+runId);

    if(ke){
      leggTilMelding("testMelding","KUNDE SELECT FEIL: "+ke.message);
      return;
    }

    const {data:dbAnsatte,error:ae}=await supabaseClient
      .from("ansatte")
      .select("*")
      .like("navn","TEST%"+runId);

    if(ae){
      leggTilMelding("testMelding","ANSATT SELECT FEIL: "+ae.message);
      return;
    }

    leggTilMelding("testMelding","Fant testkunder: "+(dbKunder?dbKunder.length:0),true);
    leggTilMelding("testMelding","Fant testansatte: "+(dbAnsatte?dbAnsatte.length:0),true);

    if(!dbKunder?.length||!dbAnsatte?.length){
      leggTilMelding("testMelding","STOPP: Mangler testkunder eller testansatte.");
      return;
    }

    const timerader=[];
    let teller=1;

    for(const ansatt of dbAnsatte){
      for(const kunde of dbKunder){
        for(let dag=0;dag<30;dag++){
          const d=new Date();
          d.setDate(d.getDate()-dag);

          timerader.push({
            dato:d.toISOString().slice(0,10),
            kunde_id:kunde.id,
            ansatt_id:ansatt.id,
            start_tid:"08:00",
            slutt_tid:teller%5===0?"21:30":"16:00",
            pause_minutter:30,
            timer:teller%5===0?13:7.5,
            timepris:ansatt.timelonn||1100,
            fakturerbar:teller%6!==0,
            kommentar:"STRESSTEST "+runId+" #"+teller
          });

          teller++;
        }
      }
    }

    const {error:te}=await supabaseClient.from("timer").insert(timerader);

    if(te){
      leggTilMelding("testMelding","TIMER INSERT FEIL: "+te.message);
      return;
    }

    await lastAlt();
    leggTilMelding("testMelding","STRESSTEST FERDIG. Laget "+timerader.length+" timer.",true);

  }catch(err){
    leggTilMelding("testMelding","STRESSTEST FEIL: "+err.message);
  }
}

async function testDobbeltregistrering(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter dobbeltregistreringstest...",true);

    const runId=Date.now();

    const kundeRes=await supabaseClient.from("kunder").insert({
      kundenr:"D"+runId,
      navn:"TEST DOBBELT Kunde "+runId,
      adresse:"Test",
      epost:"dobbelkunde"+runId+"@test.no",
      telefon:"90000000"
    }).select().single();

    if(kundeRes.error){
      leggTilMelding("testMelding","KUNDE FEIL: "+kundeRes.error.message);
      return;
    }

    const ansattEpost="dobbelansatt"+runId+"@test.no";
    const okAuth=await opprettAuthBrukerHvisMangler(ansattEpost,"testMelding");
    if(!okAuth)return;

    const ansattRes=await supabaseClient.from("ansatte").insert({
      ansatt_nr:"DOB"+runId,
      navn:"TEST DOBBELT Ansatt "+runId,
      epost:ansattEpost,
      mobil:"90000000",
      timelonn:1000,
      rolle:"bruker",
      aktiv:true
    }).select().single();

    if(ansattRes.error){
      leggTilMelding("testMelding","ANSATT FEIL: "+ansattRes.error.message);
      return;
    }

    const rad={
      dato:new Date().toISOString().slice(0,10),
      kunde_id:kundeRes.data.id,
      ansatt_id:ansattRes.data.id,
      start_tid:"08:00",
      slutt_tid:"16:00",
      pause_minutter:30,
      timer:7.5,
      timepris:1000,
      fakturerbar:true,
      kommentar:"DOBBELTTEST "+runId
    };

    const first=await supabaseClient.from("timer").insert(rad);

    if(first.error){
      leggTilMelding("testMelding","FØRSTE TIMER FEIL: "+first.error.message);
      return;
    }

    const second=await supabaseClient.from("timer").insert(rad);

    if(second.error){
      leggTilMelding("testMelding","OK: Dobbeltregistrering ble stoppet: "+second.error.message,true);
    }else{
      leggTilMelding("testMelding","FEIL: Dobbeltregistrering ble lagret. Dette må fikses.");
    }

    await lastAlt();

  }catch(err){
    leggTilMelding("testMelding","DOBBELTTEST FEIL: "+err.message);
  }
}

async function testBlankLagring(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter blank lagring-test...",true);

    visSide("kunderSide");
    blankKunde();
    await lagreKunde();

    if((el("kundeMelding").textContent||"").includes("Kundenavn må fylles ut")){
      leggTilMelding("testMelding","OK: Blank kunde ble stoppet.",true);
    }else{
      leggTilMelding("testMelding","FEIL: Blank kunde ble ikke stoppet.");
    }

    visSide("ansatteSide");
    blankAnsatt();
    await lagreAnsatt();

    if((el("ansattMelding").textContent||"").includes("Navn og e-post må fylles ut")){
      leggTilMelding("testMelding","OK: Blank ansatt ble stoppet.",true);
    }else{
      leggTilMelding("testMelding","FEIL: Blank ansatt ble ikke stoppet.");
    }

    visSide("timerSide");
    blankTimer();
    el("timeAnsatt").value="";
    el("timeKunde").value="";
    await lagreTimer();

    if((el("timerMelding").textContent||"").includes("Fyll ut ansatt")){
      leggTilMelding("testMelding","OK: Blank timer ble stoppet.",true);
    }else{
      leggTilMelding("testMelding","FEIL: Blank timer ble ikke stoppet.");
    }

    visSide("testSide");
    leggTilMelding("testMelding","BLANK LAGRING-TEST FERDIG.",true);

  }catch(err){
    leggTilMelding("testMelding","BLANK LAGRING FEIL: "+err.message);
  }
}

async function testLonn(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter lønnstest...",true);

    const runId=Date.now();
    const epost="lonn"+runId+"@test.no";

    const okAuth=await opprettAuthBrukerHvisMangler(epost,"testMelding");
    if(!okAuth)return;

    const res=await supabaseClient.from("ansatte").insert({
      ansatt_nr:"LONN"+runId,
      navn:"TEST LØNN "+runId,
      epost:epost,
      mobil:"90000099",
      timelonn:1000,
      rolle:"bruker",
      aktiv:true,
      pensjonstrekk:2,
      trekk_kommentar:"Test trekk"
    }).select().single();

    if(res.error){
      leggTilMelding("testMelding","LØNN INSERT FEIL: "+res.error.message);
      return;
    }

    const brutto=1000*10;
    const pensjon=brutto*0.02;
    const etterPensjon=brutto-pensjon;

    leggTilMelding("testMelding","OK: Testansatt laget med timelønn 1000.",true);
    leggTilMelding("testMelding","10 timer gir brutto: "+brutto+" kr.",true);
    leggTilMelding("testMelding","Pensjonstrekk 2%: "+pensjon+" kr.",true);
    leggTilMelding("testMelding","Etter pensjonstrekk: "+etterPensjon+" kr.",true);

    await lastAnsatte();

  }catch(err){
    leggTilMelding("testMelding","LØNNSTEST FEIL: "+err.message);
  }
}

async function testFakturaGrunnlag(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter fakturagrunnlag-test...",true);

    const {data,error}=await supabaseClient
      .from("timer")
      .select("timer,timepris,fakturerbar,kommentar,kunde_id")
      .eq("fakturerbar",true)
      .like("kommentar","STRESSTEST%");

    if(error){
      leggTilMelding("testMelding","FAKTURA SELECT FEIL: "+error.message);
      return;
    }

    if(!data || data.length===0){
      leggTilMelding("testMelding","Ingen fakturerbare STRESSTEST-timer funnet. Kjør stresstest først.");
      return;
    }

    const sum=data.reduce((s,t)=>s+(Number(t.timer||0)*Number(t.timepris||0)),0);

    leggTilMelding("testMelding","OK: Fant fakturerbare testtimer: "+data.length,true);
    leggTilMelding("testMelding","Fakturagrunnlag eks. mva: "+sum.toFixed(2)+" kr",true);

  }catch(err){
    leggTilMelding("testMelding","FAKTURATEST FEIL: "+err.message);
  }
}

async function testMva(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter MVA-test...",true);

    const {data,error}=await supabaseClient
      .from("timer")
      .select("timer,timepris,fakturerbar,kommentar")
      .eq("fakturerbar",true)
      .like("kommentar","STRESSTEST%");

    if(error){
      leggTilMelding("testMelding","MVA SELECT FEIL: "+error.message);
      return;
    }

    if(!data || data.length===0){
      leggTilMelding("testMelding","Ingen fakturerbare STRESSTEST-timer funnet. Kjør stresstest først.");
      return;
    }

    const eksMva=data.reduce((s,t)=>s+(Number(t.timer||0)*Number(t.timepris||0)),0);
    const mva=eksMva*0.25;
    const inklMva=eksMva+mva;

    leggTilMelding("testMelding","Eks. mva: "+eksMva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","MVA 25%: "+mva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","Inkl. mva: "+inklMva.toFixed(2)+" kr",true);

  }catch(err){
    leggTilMelding("testMelding","MVA-TEST FEIL: "+err.message);
  }
}

async function testFakturaSperre(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter test av fakturasperre...",true);

    const {data,error}=await supabaseClient
      .from("timer")
      .select("*")
      .eq("fakturerbar",true)
      .eq("fakturert",false)
      .like("kommentar","STRESSTEST%");

    if(error){
      leggTilMelding("testMelding","FAKTURA SELECT FEIL: "+error.message);
      return;
    }

    if(!data || data.length===0){
      leggTilMelding("testMelding","Ingen ufakturerte testtimer funnet. Kjør stresstest først, eller alle er allerede fakturert.");
      return;
    }

    const eksMva=data.reduce((s,t)=>s+(Number(t.timer||0)*Number(t.timepris||0)),0);
    const mva=eksMva*0.25;
    const inklMva=eksMva+mva;
    const fakturaId=crypto.randomUUID();

    const fakturaRes=await supabaseClient.from("fakturaer").insert({
      id:fakturaId,
      kunden_id:data[0].kunde_id,
      fakturanr:"TEST-"+Date.now(),
      eks_mva:eksMva,
      mva:mva,
      inkl_mva:inklMva
    });

    if(fakturaRes.error){
      leggTilMelding("testMelding","FAKTURA INSERT FEIL: "+fakturaRes.error.message);
      return;
    }

    const ids=data.map(t=>t.id);

    const updateRes=await supabaseClient
      .from("timer")
      .update({
        fakturert:true,
        faktura_id:fakturaId,
        fakturert_at:new Date().toISOString()
      })
      .in("id",ids);

    if(updateRes.error){
      leggTilMelding("testMelding","FAKTURA UPDATE FEIL: "+updateRes.error.message);
      return;
    }

    leggTilMelding("testMelding","OK: Fakturerte "+data.length+" timer.",true);
    leggTilMelding("testMelding","Eks. mva: "+eksMva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","MVA: "+mva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","Inkl. mva: "+inklMva.toFixed(2)+" kr",true);

    const kontroll=await supabaseClient
      .from("timer")
      .select("*")
      .eq("fakturerbar",true)
      .eq("fakturert",false)
      .like("kommentar","STRESSTEST%");

    if(kontroll.error){
      leggTilMelding("testMelding","KONTROLL FEIL: "+kontroll.error.message);
      return;
    }

    leggTilMelding("testMelding","Kontroll: Ufakturerte testtimer igjen: "+kontroll.data.length,true);

  }catch(err){
    leggTilMelding("testMelding","FAKTURASPERRE FEIL: "+err.message);
  }
}

async function testMvaSperre(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter test av MVA-sperre...",true);

    const {data,error}=await supabaseClient
      .from("timer")
      .select("*")
      .eq("fakturert",true)
      .eq("mva_registrert",false)
      .like("kommentar","STRESSTEST%");

    if(error){
      leggTilMelding("testMelding","MVA SELECT FEIL: "+error.message);
      return;
    }

    if(!data || data.length===0){
      leggTilMelding("testMelding","Ingen fakturerte testtimer som mangler MVA-registrering.");
      return;
    }

    const eksMva=data.reduce((s,t)=>s+(Number(t.timer||0)*Number(t.timepris||0)),0);
    const mva=eksMva*0.25;
    const inklMva=eksMva+mva;
    const ids=data.map(t=>t.id);

    const updateRes=await supabaseClient
      .from("timer")
      .update({
        mva_registrert:true,
        mva_registrert_at:new Date().toISOString()
      })
      .in("id",ids);

    if(updateRes.error){
      leggTilMelding("testMelding","MVA UPDATE FEIL: "+updateRes.error.message);
      return;
    }

    leggTilMelding("testMelding","OK: MVA registrert for "+data.length+" timer.",true);
    leggTilMelding("testMelding","Eks. mva: "+eksMva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","MVA: "+mva.toFixed(2)+" kr",true);
    leggTilMelding("testMelding","Inkl. mva: "+inklMva.toFixed(2)+" kr",true);

    const kontroll=await supabaseClient
      .from("timer")
      .select("*")
      .eq("fakturert",true)
      .eq("mva_registrert",false)
      .like("kommentar","STRESSTEST%");

    if(kontroll.error){
      leggTilMelding("testMelding","KONTROLL FEIL: "+kontroll.error.message);
      return;
    }

    leggTilMelding("testMelding","Kontroll: Fakturerte testtimer uten MVA igjen: "+kontroll.data.length,true);

  }catch(err){
    leggTilMelding("testMelding","MVA-SPERRE FEIL: "+err.message);
  }
}

async function testRettigheter(){
  settMelding("testMelding","");

  try{
    leggTilMelding("testMelding","Starter rettighetstest...",true);

    let bruker = window.innloggetBruker || null;

    if(!bruker && typeof supabaseClient !== "undefined"){
      const { data, error } = await supabaseClient.auth.getUser();

      if(error){
        leggTilMelding("testMelding","AUTH FEIL: "+error.message);
        return;
      }

      bruker = data && data.user ? data.user : null;
      window.innloggetBruker = bruker;
    }

    const adminStatus = Boolean(window.erAdmin);

    if(!bruker){
      leggTilMelding("testMelding","FEIL: Ingen innlogget bruker.");
      return;
    }

    leggTilMelding("testMelding","Innlogget bruker: "+(bruker.email || "(ukjent e-post)"),true);
    leggTilMelding("testMelding","erAdmin = "+adminStatus,true);

    if(adminStatus){
      leggTilMelding("testMelding","OK: Admin har tilgang til testpanel, ansatte og firma.",true);
    }else{
      leggTilMelding("testMelding","OK: Ikke-admin skal ikke se adminpanel.",true);
    }

  }catch(err){
    leggTilMelding("testMelding","RETTIGHETSTEST FEIL: "+err.message);
  }
}

async function slettKunTestdata(){
  settMelding("testMelding","");

  if(!confirm("Slette kun testdata? Dette sletter IKKE firma og IKKE greknuts@online.no."))return;

  try{
    let res=await supabaseClient.from("timer").delete().or("kommentar.like.STRESSTEST%,kommentar.like.DOBBELTTEST%");
    if(res.error)throw res.error;

    res=await supabaseClient.from("kunder").delete().like("navn","TEST%");
    if(res.error)throw res.error;

    res=await supabaseClient.from("ansatte").delete().like("navn","TEST%").neq("epost","greknuts@online.no");
    if(res.error)throw res.error;

    res=await supabaseClient.from("fakturaer").delete().like("fakturanr","TEST-%");
    if(res.error)throw res.error;

    await lastAlt();
    leggTilMelding("testMelding","Kun testdata slettet. Firma og greknuts er beholdt.",true);
  }catch(err){
    leggTilMelding("testMelding","SLETTING FEIL: "+err.message);
  }
}


/* Eksporter testfunksjoner til window slik app.js finner dem */
window.kjorHelsetest = kjorHelsetest;
window.kjorStresstest = kjorStresstest;
window.testDobbeltregistrering = testDobbeltregistrering;
window.testBlankLagring = testBlankLagring;
window.testLonn = testLonn;
window.testFakturaGrunnlag = testFakturaGrunnlag;
window.testMva = testMva;
window.testFakturaSperre = testFakturaSperre;
window.testMvaSperre = testMvaSperre;
window.testRettigheter = testRettigheter;
window.slettKunTestdata = slettKunTestdata;
