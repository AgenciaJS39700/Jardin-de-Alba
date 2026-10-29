/* /extra.js — Jardín de Alba: parallax de la banda, creador de ramos en vivo y buscador de ramo (demo, sin servidor) */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var eur = function (n) { return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  var wa = function (t) { return "https://wa.me/" + (S.wa || "") + "?text=" + encodeURIComponent(t); };

  /* ---------- Parallax de la banda ---------- */
  var band = $(".xb"), bimg = band && $(".xb-im img", band);
  if (bimg && !reduce) {
    var tick = false;
    var move = function () {
      tick = false;
      var r = band.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      bimg.style.transform = "translate3d(0," + (((r.top + r.height / 2 - vh / 2) / (vh + r.height)) * -16).toFixed(2) + "%,0)";
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  /* ---------- Dibujo de cada flor (SVG) ---------- */
  function petals(n, r, len, w, col, rot) {
    var o = "";
    for (var i = 0; i < n; i++) o += '<ellipse cx="0" cy="' + (-r - len / 2) + '" rx="' + w + '" ry="' + len / 2 + '" fill="' + col + '" transform="rotate(' + (i * 360 / n + (rot || 0)) + ')"/>';
    return o;
  }
  var DRAW = {
    rosa: function () { return '<circle r="20" fill="#b8102c"/><circle r="15" fill="#d61f3c"/><path d="M-10 0a10 10 0 0 1 20 0a7 7 0 0 1-14 0a4 4 0 0 1 8 0" fill="none" stroke="#8e0a20" stroke-width="2.2" stroke-linecap="round"/>'; },
    blanca: function () { return '<circle r="20" fill="#e9e1d3"/><circle r="15" fill="#fbf7ef"/><path d="M-10 0a10 10 0 0 1 20 0a7 7 0 0 1-14 0a4 4 0 0 1 8 0" fill="none" stroke="#d4c7b2" stroke-width="2.2" stroke-linecap="round"/>'; },
    tulipan: function () { return '<path d="M-14 -4c0-14 6-20 14-22c8 2 14 8 14 22c0 12-6 18-14 18s-14-6-14-18z" fill="#f07aa6"/><path d="M-6 -20c4 6 4 18 0 30M6 -20c-4 6-4 18 0 30" fill="none" stroke="#d6507f" stroke-width="2"/>'; },
    girasol: function () { return petals(14, 9, 16, 5, "#f6b40e") + '<circle r="11" fill="#6b3d12"/><circle r="6" fill="#4a2909"/>'; },
    margarita: function () { return petals(12, 5, 12, 3.6, "#ffffff") + '<circle r="6" fill="#f2c21b"/>'; },
    peonia: function () { return '<circle r="26" fill="#f5a6b8"/><circle cx="-8" cy="-6" r="13" fill="#f8bccb"/><circle cx="9" cy="-4" r="12" fill="#f39bb0"/><circle cx="0" cy="8" r="13" fill="#f7b3c3"/><circle r="7" fill="#ee8aa2"/>'; },
    lavanda: function () { var o = '<path d="M0 26V-30" stroke="#5f8a47" stroke-width="2.4"/>'; for (var i = 0; i < 7; i++) o += '<ellipse cx="' + (i % 2 ? 4 : -4) + '" cy="' + (-26 + i * 7) + '" rx="4.6" ry="6" fill="' + (i % 2 ? "#8a63c4" : "#a07ed6") + '"/>'; return o; },
    eucalipto: function () { return '<path d="M0 30V-30" stroke="#6f8f7a" stroke-width="2"/>' + [-22, -10, 2, 14].map(function (y, i) { return '<ellipse cx="' + (i % 2 ? 8 : -8) + '" cy="' + y + '" rx="8" ry="6.5" fill="' + (i % 2 ? "#9bb5a5" : "#86a493") + '"/>'; }).join(""); }
  };
  var FL = [
    { id: "rosa", n: "Rosa roja", p: 3.5, max: 24, r: 20 },
    { id: "blanca", n: "Rosa blanca", p: 3.5, max: 24, r: 20 },
    { id: "peonia", n: "Peonía", p: 6, max: 10, r: 26 },
    { id: "tulipan", n: "Tulipán", p: 2.5, max: 20, r: 18 },
    { id: "girasol", n: "Girasol", p: 3, max: 12, r: 25 },
    { id: "margarita", n: "Margarita", p: 1.5, max: 20, r: 16 },
    { id: "lavanda", n: "Lavanda", p: 1, max: 15, r: 14 },
    { id: "eucalipto", n: "Eucalipto (verde)", p: 1.2, max: 12, r: 18 }
  ];
  var WR = [
    { id: "kraft", n: "Kraft", c: "#c9a47a", d: "#a9845c" },
    { id: "rosa", n: "Rosa empolvado", c: "#f1c6d3", d: "#d9a0b2" },
    { id: "crema", n: "Crema", c: "#f3ead8", d: "#d8ccb3" },
    { id: "salvia", n: "Verde salvia", c: "#a9bfa8", d: "#869e85" },
    { id: "negro", n: "Negro mate", c: "#2b2b2e", d: "#111113" }
  ];
  var WRAP_PRICE = 4;

  var bq = $("#bq");
  if (bq) {
    var q = { rosa: 5, blanca: 0, peonia: 0, tulipan: 0, girasol: 0, margarita: 3, lavanda: 0, eucalipto: 3 }, wrap = "kraft", lastAdd = "";
    var mini = function (id) { return '<svg viewBox="-34 -34 68 68" aria-hidden="true">' + DRAW[id]() + "</svg>"; };
    bq.innerHTML = '<div class="bq-v"><svg id="bqs" viewBox="0 0 320 360" role="img" aria-label="Vista previa de tu ramo"></svg><div class="bq-card" id="bqcard" aria-hidden="true"></div></div>' +
      '<div class="bq-c"><div><h4>1 · Elige las flores</h4><div class="flw">' + FL.map(function (f) {
        return '<div class="fr"><span class="sw2">' + mini(f.id) + "</span><span><b>" + esc(f.n) + "</b><small>" + eur(f.p) + ' / tallo</small></span><span class="qt"><button type="button" data-m="' + f.id + '" aria-label="Quitar ' + esc(f.n) + '">−</button><span id="q-' + f.id + '" aria-live="polite">0</span><button type="button" data-p="' + f.id + '" aria-label="Añadir ' + esc(f.n) + '">+</button></span></div>';
      }).join("") + '</div></div><div><h4>2 · Papel y lazo</h4><div class="wraps" role="group" aria-label="Papel">' + WR.map(function (w) { return '<button type="button" class="wp" data-w="' + w.id + '" aria-pressed="false"><i style="background:' + w.c + '"></i>' + esc(w.n) + "</button>"; }).join("") + '</div></div><div><h4>3 · Dedicatoria (opcional)</h4><textarea id="bqmsg" maxlength="140" placeholder="Feliz cumpleaños, mamá. Te quiero mucho."></textarea></div>' +
      '<div class="bq-sum"><span><small id="bqn"></small><b id="bqt"></b></span><a class="btn btn-wa" id="bqgo" target="_blank" rel="noopener" href="#">' + (S.icons && S.icons.wa || "") + "Pedir este ramo</a></div></div>";

    // Posiciones fijas en espiral (ángulo áureo) dentro de la cúpula del ramo
    var POS = [];
    for (var i = 0; i < 70; i++) { var a = i * 2.39996, rr = Math.sqrt(i / 70); POS.push([160 + Math.cos(a) * rr * 104, 134 + Math.sin(a) * rr * 60 - (1 - rr) * 16]); }
    var draw = function () {
      var list = [];
      FL.forEach(function (f) { if (f.id !== "eucalipto") for (var k = 0; k < q[f.id]; k++) list.push(f.id); });
      // mezcla estable para que no queden en bloques
      var mixed = [], buckets = {}; list.forEach(function (id) { (buckets[id] = buckets[id] || []).push(id); });
      var keys = Object.keys(buckets), more = true;
      while (more) { more = false; keys.forEach(function (k) { if (buckets[k].length) { mixed.push(buckets[k].shift()); more = true; } }); }
      var w = WR.filter(function (x) { return x.id === wrap; })[0];
      var greens = "";
      for (var g = 0; g < q.eucalipto; g++) { var ang = -70 + (g / Math.max(1, q.eucalipto - 1)) * 140; greens += '<g transform="translate(160 170) rotate(' + ang.toFixed(1) + ') translate(0 -96) scale(1.7)">' + DRAW.eucalipto() + "</g>"; }
      var stems = '<path d="M140 190L150 330M160 190V334M180 190L170 330" stroke="#5f8a47" stroke-width="5" stroke-linecap="round"/>';
      var flowers = mixed.map(function (id, i) {
        var p = POS[i % POS.length], f = FL.filter(function (x) { return x.id === id; })[0], s = 1.5 - Math.min(.55, mixed.length / 50);
        return '<g transform="translate(' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ") scale(" + s.toFixed(2) + ')"><g class="' + (id === lastAdd && i === mixed.lastIndexOf(id) ? "fl2" : "") + '">' + DRAW[id]() + "</g></g>";
      }).reverse().join("");
      var paper = '<path d="M56 160L160 342L264 160L232 182L160 196L88 182Z" fill="' + w.c + '"/><path d="M56 160L112 230M264 160L208 230M160 196V342" stroke="' + w.d + '" stroke-width="2" opacity=".6" fill="none"/>' +
        '<path d="M28 150L76 148L160 320L244 148L292 150L250 196L160 352L70 196Z" fill="' + w.c + '" opacity=".55"/>' +
        '<path d="M130 262c-26-20-40-6-30 6s26 4 30-6zm60 0c26-20 40-6 30 6s-26 4-30-6z" fill="' + (wrap === "negro" ? "#d9b26a" : "#e08aa5") + '"/><circle cx="160" cy="262" r="9" fill="' + (wrap === "negro" ? "#c99a45" : "#c25b82") + '"/>';
      $("#bqs").innerHTML = '<ellipse cx="160" cy="350" rx="80" ry="8" fill="#000" opacity=".1"/><g class="sw">' + stems + greens + (mixed.length ? flowers : '<text x="160" y="130" text-anchor="middle" fill="currentColor" opacity=".5" font-size="15">Añade flores ✿</text>') + paper + "</g>";
      var tallos = 0, tot = WRAP_PRICE;
      FL.forEach(function (f) { $("#q-" + f.id).textContent = q[f.id]; tallos += q[f.id]; tot += q[f.id] * f.p; });
      [].forEach.call(bq.querySelectorAll(".wp"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.w === wrap)); });
      $("#bqn").textContent = tallos + " tallos · papel " + w.n.toLowerCase() + " incluido";
      $("#bqt").textContent = eur(Math.round(tot * 100) / 100);
      var msg = $("#bqmsg").value.trim();
      $("#bqcard").textContent = msg;
      var desc = FL.filter(function (f) { return q[f.id]; }).map(function (f) { return q[f.id] + "× " + f.n; }).join(", ");
      $("#bqgo").href = wa("Hola, quiero este ramo personalizado:\n" + (desc || "(sin flores)") + "\nPapel: " + w.n + (msg ? "\nDedicatoria: " + msg : "") + "\nTotal orientativo: " + eur(Math.round(tot * 100) / 100) + "\n¿Para cuándo lo tendríais?");
      $("#bqgo").setAttribute("aria-disabled", String(!mixed.length));
    };
    bq.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var f;
      if (b.dataset.p) { f = FL.filter(function (x) { return x.id === b.dataset.p; })[0]; if (q[f.id] < f.max) { q[f.id]++; lastAdd = f.id; } }
      else if (b.dataset.m) { if (q[b.dataset.m] > 0) q[b.dataset.m]--; lastAdd = ""; }
      else if (b.dataset.w) { wrap = b.dataset.w; lastAdd = ""; }
      draw();
    });
    $("#bqgo").addEventListener("click", function (e) { if (this.getAttribute("aria-disabled") === "true") e.preventDefault(); });
    $("#bqmsg").addEventListener("input", function () { $("#bqcard").textContent = this.value.trim(); });
    $("#bqmsg").addEventListener("change", draw);
    draw();
    window.__ramo = function (preset) { for (var k in q) q[k] = preset[k] || 0; lastAdd = ""; draw(); };
  }

  /* ---------- Buscador de ramo (3 preguntas) ---------- */
  var qz = $("#qz");
  if (qz) {
    var QS = [
      { t: "¿Para qué ocasión?", k: "o", o: [["amor", "❤️", "Amor o aniversario"], ["cumple", "🎂", "Cumpleaños"], ["gracias", "🙏", "Dar las gracias"], ["perdon", "🕊️", "Pedir perdón"], ["casa", "🏡", "Para casa u oficina"], ["evento", "🥂", "Una mesa o evento"]] },
      { t: "¿Qué estilo le va más?", k: "e", o: [["clasico", "🌹", "Clásico y elegante"], ["alegre", "🌻", "Alegre y de color"], ["romantico", "🌸", "Romántico y suave"], ["natural", "🌿", "Natural y campestre"]] },
      { t: "¿Cuánto te quieres gastar?", k: "b", o: [["b1", "💶", "Hasta 20 €"], ["b2", "💶", "20 – 30 €"], ["b3", "✨", "Sin límite, que sea especial"]] }
    ];
    var WHY = {
      rosas: "Las rosas rojas son el lenguaje del amor por excelencia: nunca fallan.",
      tulipanes: "Los tulipanes transmiten alegría y cariño sincero, perfectos para felicitar.",
      girasol: "El girasol es pura energía: dice «me alegras el día» sin palabras.",
      margaritas: "Sencillas y frescas, las margaritas son un detalle bonito que no abruma.",
      peonia: "La peonía es la flor más romántica y lujosa de la temporada.",
      suculenta: "Una planta que dura meses con muy pocos cuidados: ideal para casa u oficina.",
      lavanda: "Aromática y natural, la lavanda perfuma la casa y relaja.",
      centro: "Un centro bajo con velas viste cualquier mesa y deja hablar a los invitados."
    };
    var pick = function (a) {
      if (a.o === "evento") return "centro";
      if (a.o === "casa") return a.e === "natural" ? "lavanda" : "suculenta";
      if (a.b === "b3") return a.e === "alegre" ? "tulipanes" : a.e === "natural" ? "centro" : "peonia";
      if (a.o === "amor" || a.e === "clasico") return a.b === "b1" ? "margaritas" : "rosas";
      if (a.e === "alegre") return a.b === "b1" ? "girasol" : "tulipanes";
      if (a.e === "romantico") return a.b === "b1" ? "margaritas" : "tulipanes";
      return a.b === "b1" ? "margaritas" : "girasol";
    };
    var ans = {}, step = 0;
    var render = function () {
      var prog = '<div class="qz-p" aria-hidden="true">' + QS.map(function (x, i) { return '<i class="' + (i <= step ? "on" : "") + '"></i>'; }).join("") + "<i class=\"" + (step >= QS.length ? "on" : "") + '"></i></div>';
      if (step < QS.length) {
        var Q = QS[step];
        qz.innerHTML = prog + "<h3>" + esc(Q.t) + '</h3><div class="qz-o">' + Q.o.map(function (o) { return '<button type="button" data-v="' + o[0] + '"><span aria-hidden="true">' + o[1] + "</span>" + esc(o[2]) + "</button>"; }).join("") + "</div>" + (step ? '<button class="btn btn-ghost btn-sm" type="button" data-back style="justify-self:start">← Atrás</button>' : "");
        return;
      }
      var id = pick(ans), card = document.querySelector('.pc[data-id="' + id + '"]');
      var name = card ? card.querySelector("h3").textContent : id, price = card ? card.querySelector(".pr").textContent.replace(/\s*\/ud.*/, "") : "";
      qz.innerHTML = prog + '<div class="qz-r"><img src="img/' + id + '-m.webp" alt="' + esc(name) + '" loading="lazy" decoding="async"><div style="display:grid;gap:.8rem"><span class="kicker">Tu ramo ideal</span><h3>' + esc(name) + '</h3><p class="why">' + esc(WHY[id] || "") + '</p><span class="pr2">' + esc(price) + '</span><div class="qz-a"><button class="btn btn-main" type="button" data-cart="' + id + '">Añadir al pedido</button><button class="btn btn-ghost" type="button" data-again>Volver a empezar</button></div></div></div>';
    };
    qz.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.v) { ans[QS[step].k] = b.dataset.v; step++; }
      else if (b.hasAttribute("data-back")) step = Math.max(0, step - 1);
      else if (b.hasAttribute("data-again")) { ans = {}; step = 0; }
      else if (b.dataset.cart) { var add = document.querySelector('[data-add="' + b.dataset.cart + '"]'); if (add) add.click(); return; }
      render();
    });
    render();
  }
})();
