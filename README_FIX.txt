TIMEREGISTRERING - KNAPPER OG TESTPANEL FIKSET

Endret i denne pakken:
- Testpanel er lagt tilbake i index.html.
- tester.js lastes før app.js.
- app.js kobler alle testknappene, lønnsknappene, kreditnota, backup, faktura og MVA.
- Den gamle inline stressTest-knappen er fjernet slik at bare kjorStresstest brukes.
- navigation.js skjuler/viser testSide riktig.
- Nytt passord-skjema har felt for gjentatt passord, slik auth.js forventer.

Du er egentlig allerede inne på de riktige testene. Det som mangler nå er å gjøre dem mer systematiske, så du får en slags “pre-flight check” før du tør å stole på systemet ✈️🧪

Jeg ville delt det i nivåer:

# 1. Kritiske produksjonstester

Dette er “må aldri feile”.

## Login

Test:

* riktig passord
* feil passord
* glemt passord
* nytt passord
* logout
* vanlig bruker vs admin

---

## Timer

Test:

* lagre timer
* redigere timer
* slette timer
* blanke felt
* nattarbeid
* mange timer
* negativ verdi
* datoformat

---

## Faktura

Test:

* én kunde
* flere kunder
* samme kunde flere ganger
* kopi av faktura
* faktura etter reload
* faktura med mange linjer
* faktura uten logo

---

## MVA

Veldig viktig.

Test:

* MVA regnes riktig
* eksporteres bare én gang
* kopi lager IKKE ny MVA
* kreditnota lager negativ MVA
* kreditnota kopi lager ikke ny negativ linje

---

## Kreditnota

Test:

* kreditnota mot riktig kunde
* kreditnota mot feil måned
* kopi
* PDF
* CSV

---

# 2. Databasetester

Dette er “unngå katastrofer”.

## Dobbeltregistrering

Prøv:

* samme dato
* samme kunde
* samme tid
* dobbelt klikk lagre

Du har allerede begynt her 👌

---

## Samtidige brukere

Test:

* to brukere lagrer samtidig
* samme kunde
* samme måned
* faktura samtidig

---

## Backup/restore

Test:

* eksport backup
* slett testdata
* importer backup
* sjekk at alt kommer tilbake

Dette er ekstremt viktig.

---

# 3. “Dumme bruker”-tester 😄

De beste testene.

Prøv:

* tomme felt
* rare tegn
* kjempelange tekster
* laste opp feil fil
* dobbeltklikk
* trykke fort
* refresh midt i lagring
* mobilskjerm

---

# 4. Belastning/stresstest

Du er allerede på vei hit.

Lag:

* mange ansatte
* mange kunder
* mange timer
* mange fakturaer

Test:

* hastighet
* PDF-generering
* minnebruk
* timeout

---

# 5. Sikkerhet

Veldig viktig hvis dette blir ekte bruk.

Test:

* vanlig bruker ser ikke admin
* vanlig bruker kan ikke lage kreditnota
* vanlig bruker kan ikke slette andre
* ingen kan hente alt via console/API

---

# 6. “Virkelig verden”-test

Den viktigste.

Bruk systemet som om:

* du er stresset
* står ute hos kunde
* bruker mobil
* dårlig nett
* klokka er 23:40
* må sende faktura før skatt 😅

Da dukker de ekte problemene opp.

---

Du har faktisk allerede tenkt mer produksjon enn mange små startups gjør. Nå handler det mest om å:

* automatisere litt
* teste systematisk
* ikke endre ti ting samtidig

Da blir dette ganske robust.


Viktig:
- config.js er beholdt fra fungerende versjon.
- Testen oppretter ikke Supabase Auth-brukere fra nettleseren. Den tester ansatt-rader og timer, men logger at Auth-opprettelse hoppes over.
