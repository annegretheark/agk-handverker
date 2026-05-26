
Legg dette inn i tester.js nederst:

window.tomAlleDemodata = tomAlleDemodata;

Og legg til knapp i index.html:

<button id="tomAlleDemodataKnapp" type="button" class="danger">
  Tøm alle demodata
</button>

Og i app.js:

koble(
  "tomAlleDemodataKnapp",
  "click",
  tryggFunksjon("tomAlleDemodata")
);
