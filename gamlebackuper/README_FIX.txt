TIMEREGISTRERING - KNAPPER OG TESTPANEL FIKSET

Endret i denne pakken:
- Testpanel er lagt tilbake i index.html.
- tester.js lastes før app.js.
- app.js kobler alle testknappene, lønnsknappene, kreditnota, backup, faktura og MVA.
- Den gamle inline stressTest-knappen er fjernet slik at bare kjorStresstest brukes.
- navigation.js skjuler/viser testSide riktig.
- Nytt passord-skjema har felt for gjentatt passord, slik auth.js forventer.

Viktig:
- config.js er beholdt fra fungerende versjon.
- Testen oppretter ikke Supabase Auth-brukere fra nettleseren. Den tester ansatt-rader og timer, men logger at Auth-opprettelse hoppes over.
