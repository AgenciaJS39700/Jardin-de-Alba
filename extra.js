/* /extra.js — Jardín de Alba: parallax de la banda, creador de ramos en vivo y buscador de ramo (demo, sin servidor) */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var eur = function (n) { return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  var wa = function (t) { return "https://wa.me/" + (S.wa || "") + "?text=" + encodeURIComponent(t); };

  /* ---------- Creador de ramos con fotos reales (cada flor es una foto sin fondo) ---------- */
  // w: ancho de la flor respecto al escenario · head: va en la cúpula del ramo · back: va detrás (verdes y espigas)
  var FL = [
    { id: "rosa", n: "Rosa roja", p: 3.5, max: 24, w: 21, head: true },
    { id: "blanca", n: "Rosa blanca", p: 3.5, max: 24, w: 21, head: true },
    { id: "peonia", n: "Peonía", p: 6, max: 10, w: 26, head: true },
    { id: "girasol", n: "Girasol", p: 3, max: 12, w: 25, head: true },
    { id: "margarita", n: "Margarita", p: 1.5, max: 20, w: 15, head: true },
    { id: "tulipan", n: "Tulipán", p: 2.5, max: 20, w: 15, back: true },
    { id: "lavanda", n: "Lavanda", p: 1, max: 15, w: 24, back: true },
    { id: "eucalipto", n: "Eucalipto (verde)", p: 1.2, max: 12, w: 30, back: true }
  ];
  var WR = [
    { id: "kraft", n: "Kraft", c: "#c69a6a" },
    { id: "rosa", n: "Rosa empolvado", c: "#efb6c6" },
    { id: "crema", n: "Crema", c: "" },
    { id: "salvia", n: "Verde salvia", c: "#9db79c" },
    { id: "negro", n: "Negro mate", c: "#3b3a3f" }
  ];
  var WRAP_PRICE = 4;
  var src = function (id) { return "img/ramo/" + id + ".webp"; };
  // Posiciones fijas: espiral de ángulo áureo dentro de la cúpula (en % del escenario)
  // Cúpula que se abre a lo ancho según cuántas flores haya (espiral de ángulo áureo, en % del escenario)
  function dome(n) {
    var out = [], rx = Math.min(38, 15 + n * 2.1), ry = Math.min(19, 8 + n * 0.75);
    for (var i = 0; i < n; i++) { var a = i * 2.39996, rr = Math.sqrt((i + .5) / n); out.push([50 + Math.cos(a) * rr * rx, 46 + Math.sin(a) * rr * ry - (1 - rr) * 6]); }
    return out;
  }
  // Abanico para lo que va detrás (ángulo en grados)
  var fan = function (k, n, spread) { return n < 2 ? 0 : -spread / 2 + k * spread / (n - 1); };

  var bq = $("#bq");
  if (bq) {
    var q = { rosa: 5, blanca: 0, peonia: 1, girasol: 0, margarita: 3, tulipan: 0, lavanda: 2, eucalipto: 4 }, wrap = "kraft", lastAdd = "";
    bq.innerHTML = '<div class="bq-v"><div class="bq-st" id="bqs" role="img" aria-label="Vista previa de tu ramo"></div><div class="bq-card" id="bqcard" aria-hidden="true"></div></div>' +
      '<div class="bq-c"><div><h4>1 · Elige las flores</h4><div class="flw">' + FL.map(function (f) {
        return '<div class="fr"><span class="sw2"><img src="' + src(f.id) + '" alt="" loading="lazy" decoding="async"></span><span><b>' + esc(f.n) + "</b><small>" + eur(f.p) + ' / tallo</small></span><span class="qt"><button type="button" data-m="' + f.id + '" aria-label="Quitar ' + esc(f.n) + '">−</button><span id="q-' + f.id + '" aria-live="polite">0</span><button type="button" data-p="' + f.id + '" aria-label="Añadir ' + esc(f.n) + '">+</button></span></div>';
      }).join("") + '</div></div><div><h4>2 · Papel y lazo</h4><div class="wraps" role="group" aria-label="Papel">' + WR.map(function (w) { return '<button type="button" class="wp" data-w="' + w.id + '" aria-pressed="false"><i style="background:' + (w.c || "#f4eee2") + '"></i>' + esc(w.n) + "</button>"; }).join("") + '</div></div><div><h4>3 · Dedicatoria (opcional)</h4><textarea id="bqmsg" maxlength="140" placeholder="Feliz cumpleaños, mamá. Te quiero mucho."></textarea></div>' +
      '<div class="bq-sum"><span><small id="bqn"></small><b id="bqt"></b></span><a class="btn btn-wa" id="bqgo" target="_blank" rel="noopener" href="#">' + (S.icons && S.icons.wa || "") + "Pedir este ramo</a></div></div>";

    var paper = function (cls, w) {
      return '<span class="pp ' + cls + '"><img src="' + src("papel") + '" alt="">' + (w.c ? '<i style="background:' + w.c + '"></i>' : "") + "</span>";
    };
    var draw = function () {
      var w = WR.filter(function (x) { return x.id === wrap; })[0], html = "";
      // 1) detrás: eucalipto, lavanda y tulipanes en abanico
      var backs = [];
      ["eucalipto", "lavanda", "tulipan"].forEach(function (id) { for (var k = 0; k < q[id]; k++) backs.push(id); });
      backs.forEach(function (id, k) {
        var f = FL.filter(function (x) { return x.id === id; })[0], n = q[id], idx = backs.slice(0, k).filter(function (x) { return x === id; }).length;
        var ang = fan(idx, n, id === "eucalipto" ? 140 : id === "lavanda" ? 96 : 80) + (idx % 2 ? 4 : -4);
        var bot = id === "eucalipto" ? 40 : id === "lavanda" ? 45 : 50;
        html += '<img class="fl2 bk' + (id === lastAdd && idx === n - 1 ? " nw" : "") + '" src="' + src(id) + '" alt="" style="width:' + f.w + "%;left:" + (50 - f.w / 2) + "%;bottom:" + bot + "%;transform:rotate(" + ang.toFixed(1) + 'deg);z-index:' + (id === "eucalipto" ? 1 : 2) + '">';
      });
      // 2) papel por detrás
      html += paper("pb", w);
      // 3) cabezas en la cúpula, mezcladas para que no queden en bloques
      var heads = [], buckets = {};
      FL.forEach(function (f) { if (f.head) for (var k = 0; k < q[f.id]; k++) (buckets[f.id] = buckets[f.id] || []).push(f.id); });
      var keys = Object.keys(buckets), more = true;
      while (more) { more = false; keys.forEach(function (k) { if (buckets[k].length) { heads.push(buckets[k].shift()); more = true; } }); }
      var sc = 1.32 - Math.min(.42, heads.length / 50), DOME = dome(heads.length);
      heads.forEach(function (id, k) {
        var f = FL.filter(function (x) { return x.id === id; })[0], p = DOME[k % DOME.length], ww = f.w * sc;
        html += '<img class="fl2 hd' + (id === lastAdd && k === heads.lastIndexOf(id) ? " nw" : "") + '" src="' + src(id) + '" alt="" style="width:' + ww.toFixed(1) + "%;left:" + (p[0] - ww / 2).toFixed(1) + "%;top:" + (p[1] - ww * .55).toFixed(1) + "%;z-index:" + (10 + Math.round(p[1])) + ";transform:rotate(" + ((k * 47) % 30 - 15) + 'deg)">';
      });
      // 4) papel por delante (solo la parte de abajo) para que las flores queden dentro
      html += paper("pf", w);
      if (!heads.length && !backs.length) html += '<span class="bq-empty">Añade flores ✿</span>';
      $("#bqs").innerHTML = html;

      var tallos = 0, tot = WRAP_PRICE;
      FL.forEach(function (f) { $("#q-" + f.id).textContent = q[f.id]; tallos += q[f.id]; tot += q[f.id] * f.p; });
      tot = Math.round(tot * 100) / 100;
      [].forEach.call(bq.querySelectorAll(".wp"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.w === wrap)); });
      $("#bqn").textContent = tallos + " tallos · papel " + w.n.toLowerCase() + " incluido";
      $("#bqt").textContent = eur(tot);
      var msg = $("#bqmsg").value.trim();
      $("#bqcard").textContent = msg;
      var desc = FL.filter(function (f) { return q[f.id]; }).map(function (f) { return q[f.id] + "× " + f.n; }).join(", ");
      $("#bqgo").href = wa("Hola, quiero este ramo personalizado:\n" + (desc || "(sin flores)") + "\nPapel: " + w.n + (msg ? "\nDedicatoria: " + msg : "") + "\nTotal orientativo: " + eur(tot) + "\n¿Para cuándo lo tendríais?");
      $("#bqgo").setAttribute("aria-disabled", String(!tallos));
    };
    bq.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var f;
      if (b.dataset.p) { f = FL.filter(function (x) { return x.id === b.dataset.p; })[0]; if (q[f.id] < f.max) { q[f.id]++; lastAdd = f.id; } else toast2("Máximo " + f.max + " tallos de " + f.n.toLowerCase()); }
      else if (b.dataset.m) { if (q[b.dataset.m] > 0) q[b.dataset.m]--; lastAdd = ""; }
      else if (b.dataset.w) { wrap = b.dataset.w; lastAdd = ""; }
      draw();
    });
    var toast2 = function (m) { var t = document.querySelector(".toast"); if (t) { t.textContent = m; t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 1800); } };
    $("#bqgo").addEventListener("click", function (e) { if (this.getAttribute("aria-disabled") === "true") e.preventDefault(); });
    $("#bqmsg").addEventListener("input", function () { $("#bqcard").textContent = this.value.trim(); });
    $("#bqmsg").addEventListener("change", draw);
    draw();
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
