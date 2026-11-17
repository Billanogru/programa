(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function rd(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var nombre = rd("nombre", "Limber");

  /* ===== Bienvenida ===== */
  if ($("nombre")) {
    $("nombre").value = nombre;
    var pintar = function () {
      var n = $("nombre").value.trim();
      $("saludo").textContent = "Hola, " + (n || "bienvenido");
      wr("nombre", n || "Limber");
    };
    $("nombre").addEventListener("input", pintar); pintar();
  }
  if (!$("tarjetas")) return;
  $("saludo-barra").textContent = "Hola, " + nombre + " 👋";

  /* ===== Datos ===== */
  var A = [
    { g: "Práctico", n: "Defensa", e: 25, i: "🎤" },
    { g: "Práctico", n: "Producto tangible o intangible", e: 25, i: "🖥️" },
    { g: "Práctico", n: "Habilidades y destrezas técnicas", e: 20, i: "⚙️" },
    { g: "Teórico", n: "Producto final escrito", e: 15, i: "📄" },
    { g: "Teórico", n: "Proyecto", e: 15, i: "🧭" }
  ];
  var J = 1, jn = ["Jurado 1", "Jurado 2", "Jurado 3", "Jurado 4", "Jurado 5"];
  var S = A.map(function () { return [0, 0, 0, 0, 0]; });
  var C = A.map(function () { return ""; });
  var R = rd("rank", []), TT = 0, EE = 100, saved = false, lastIdx = -1, curH = -1;
  var f = function (n) { return String(Math.round(n * 10) / 10).replace(".", ","); };
  var avg = function (i) { var s = 0; for (var j = 0; j < J; j++) s += S[i][j]; return s / J; };
  var col = function (p) { return p >= 75 ? "var(--mint)" : p >= 50 ? "var(--sun)" : "var(--coral)"; };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render() {
    $("jurados").innerHTML = jn.slice(0, J).map(function (n, j) {
      return '<label>Jurado ' + (j + 1) + '<input class="jn" data-j="' + j + '" value="' + esc(n) + '"></label>';
    }).join("");
    $("tarjetas").innerHTML = A.map(function (a, i) {
      var rows = "";
      for (var j = 0; j < J; j++) {
        var d = 'data-i="' + i + '" data-j="' + j + '" value="' + S[i][j] + '"';
        rows += '<label class="fila"><span class="nj' + j + '">' + esc(jn[j]) + '</span><input type="range" min="0" max="' + a.e + '" step="0.5" ' + d + '><input class="n" type="number" min="0" max="' + a.e + '" step="0.5" ' + d + '></label>';
      }
      return '<article class="card ' + (a.g == "Práctico" ? "prac" : "teo") + '"><header><span class="ico">' + a.i + '</span><div><h3>' + a.n + '</h3><small>' + a.g + '</small></div>' +
        '<span class="peso">' + f(a.e) + ' pts</span></header>' +
        '<input class="crit" placeholder="Recomendaciones (opcional)" value="' + esc(C[i]) + '" data-i="' + i + '">' + rows +
        '<div class="prom"><div class="bar"><i id="b' + i + '"></i></div><b id="a' + i + '"></b></div></article>';
    }).join("");
    calc();
  }

  function hoja(T, E) {
    var rows = "", n = { "Práctico": 0, "Teórico": 0 };
    A.forEach(function (a) { n[a.g] += a.e; });
    var cnt = { "Práctico": 3, "Teórico": 2 }, first = {};
    A.forEach(function (a, i) {
      var k = first[a.g] ? 0 : (first[a.g] = 1);
      rows += "<tr>" + (k ? '<td rowspan="' + cnt[a.g] + '">' + a.g + " - " + f(n[a.g]) + "%</td>" : "") + "<td>" + a.n + '</td><td class="cr">' + esc(C[i]) + "</td><td>" + f(a.e) + " %</td><td>" + f(avg(i)) + "</td></tr>";
    });
    return '<p><b>Artículo 36.- (INSTRUMENTO DE EVALUACIÓN).</b> El proceso de evaluación y asignación de calificaciones de la defensa de grado se desarrollará de acuerdo al siguiente instrumento de evaluación:</p>' +
      '<div class="dat"><span>Estudiante: <b>' + esc($("est").value || "________________") + "</b></span><span>Proyecto: <b>" + esc($("proy").value || "________________") + "</b></span><span>Fecha: <b>" + new Date().toLocaleDateString("es-BO") + "</b></span></div>" +
      '<table><thead><tr><th rowspan="2">ASPECTOS - PORCENTAJE</th><th rowspan="2">Número de integrantes</th><th rowspan="2">CRITERIOS</th><th colspan="2">CALIFICACIÓN</th></tr><tr><th>Establecida</th><th>Obtenida</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr class="tf"><td colspan="3" class="v"></td><td>' + f(E) + " %</td><td>" + f(T) + "</td></tr></tfoot></table>" +
      '<p class="fin">Nota final: ' + f(T) + " / 100</p>";
  }

  function calc() {
    var tp = 0, tt = 0, E = 0, ep = 0, et = 0;
    A.forEach(function (a, i) {
      var o = avg(i), p = a.e ? o / a.e * 100 : 0;
      $("a" + i).textContent = "Promedio: " + f(o) + " de " + f(a.e) + " pts";
      $("b" + i).style.width = p + "%"; $("b" + i).style.background = col(p);
      if (a.g == "Práctico") tp += o; else tt += o;
      E += a.e; if (a.g == "Práctico") ep += a.e; else et += a.e;
    });
    TT = tp + tt; EE = E;
    $("rp").textContent = f(tp) + " / " + f(ep) + " pts"; $("rt").textContent = f(tt) + " / " + f(et) + " pts";
    $("total").textContent = f(TT);
    var m = TT >= 90 ? ["🏆", "¡Estudiante estrella!"] : TT >= 75 ? ["🥇", "¡Excelente trabajo!"] : TT >= 60 ? ["🥈", "¡Muy bien!"] : TT > 0 ? ["🥉", "¡Buen intento, sigue así!"] : ["🎯", "Mueve las barras para empezar"];
    $("medalla").textContent = m[0]; $("frase").textContent = m[1];
    $("aviso").hidden = E === 100;
    $("aviso").textContent = "⚠️ Los puntos máximos suman " + f(E) + "; deben sumar 100.";
    $("hoja").innerHTML = hoja(TT, E);
    $("mini-est").textContent = $("est").value.trim() || "Sin nombre";
    $("mini-proy").textContent = $("proy").value.trim();
    $("mini-total").textContent = f(TT);
    borrador();
  }

  /* Borrador: guarda lo que vas escribiendo para no perderlo si sales de la página */
  function borrador() { wr("borrador", { est: $("est").value, proy: $("proy").value, J: J, jn: jn, S: S, C: C }); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) borrador(); });
  window.addEventListener("pagehide", borrador);

  function say(t, err) { $("msg").textContent = t; $("msg").className = "msg" + (err ? " err" : ""); }

  function rank() {
    $("vacio").hidden = R.length > 0;
    $("lista").innerHTML = R.map(function (r, k) { return { r: r, k: k }; })
      .sort(function (a, b) { return b.r.t - a.r.t; })
      .map(function (o, p) {
        var r = o.r;
        return "<li><span>" + (["🥇", "🥈", "🥉"][p] || (p + 1) + "º") + '</span><span class="rn"><b class="nom">' + esc(r.n) + "</b>" +
          (r.p ? "<small>📁 " + esc(r.p) + "</small>" : "") + (r.d ? "<small>" + esc(r.d) + "</small>" : "") + '</span><b class="pts">' + f(r.t) + "</b>" +
          (r.h ? '<button class="ver" data-ver="' + o.k + '" aria-label="Ver documento">📄</button>' : "") +
          '<button data-del="' + o.k + '" aria-label="Quitar">✕</button></li>';
      }).join("");
  }

  function confetti() {
    if (reduce) return;
    var c = $("conf"), x = c.getContext("2d"), P = [], n = 0;
    c.width = innerWidth; c.height = innerHeight;
    for (var k = 0; k < 130; k++) P.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 15, vy: Math.random() * -13 - 2, s: 5 + Math.random() * 6, c: ["#ff5c70", "#ffc93c", "#2ec4a6", "#3aa7f0", "#7b5cff"][k % 5] });
    (function d() {
      x.clearRect(0, 0, c.width, c.height);
      P.forEach(function (p) { p.vy += .35; p.x += p.vx; p.y += p.vy; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s); });
      if (++n < 110) requestAnimationFrame(d); else x.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* ===== Eventos ===== */
  document.addEventListener("input", function (e) {
    var t = e.target, i = +t.dataset.i, j = +t.dataset.j;
    saved = false;
    if (t.type == "range" || t.classList.contains("n")) {
      var v = Math.max(0, Math.min(A[i].e, parseFloat(t.value) || 0)); S[i][j] = v;
      if (parseFloat(t.value) > A[i].e) t.value = v;
      $("tarjetas").querySelectorAll('[data-i="' + i + '"][data-j="' + j + '"]').forEach(function (p) { if (p !== t) p.value = v; });
    }
    else if (t.classList.contains("crit")) C[i] = t.value;
    else if (t.classList.contains("jn")) {
      jn[j] = t.value || "Jurado " + (j + 1);
      document.querySelectorAll(".nj" + j).forEach(function (s) { s.textContent = jn[j]; });
    }
    calc();
  });
  $("nj").addEventListener("change", function () { J = +this.value; saved = false; render(); });
  $("revelar").addEventListener("click", function () {
    confetti();
    if (reduce) return;
    var t0 = performance.now(), T = TT;
    (function s(t) { var k = Math.min(1, (t - t0) / 1200); $("total").textContent = f(T * k); if (k < 1) requestAnimationFrame(s); })(t0);
  });
  function sello() { var d = new Date(); return d.toLocaleDateString("es-BO") + " " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }); }
  $("guardar").addEventListener("click", function () {
    var n = $("est").value.trim();
    if (!n) { say("⚠️ Escribe el nombre del estudiante para guardarlo en el ranking.", 1); $("est").focus(); return; }
    var rec = { n: n, p: $("proy").value.trim(), t: Math.round(TT * 10) / 10, d: sello(), h: hoja(TT, EE) };
    if (saved && lastIdx >= 0 && R[lastIdx]) R[lastIdx] = rec; else { R.push(rec); lastIdx = R.length - 1; }
    saved = true; wr("rank", R); rank();
    say("✅ " + n + " guardado en el ranking con " + f(TT) + " pts. Su documento quedó en el historial.");
  });
  $("lista").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ver !== undefined) { abrirDoc(+b.dataset.ver); return; }
    if (b.dataset.del === undefined) return;
    var k = +b.dataset.del;
    if (!confirm("¿Quitar a " + R[k].n + " del ranking? También se borrará su documento guardado.")) return;
    R.splice(k, 1); wr("rank", R); saved = false; lastIdx = -1; rank();
  });
  $("nuevo").addEventListener("click", function () {
    var hay = $("est").value.trim() || S.some(function (r) { return r.some(function (v) { return v > 0; }); });
    if (hay && !saved && !confirm("Este estudiante aún no está guardado en el ranking y se perderá su documento. ¿Continuar sin guardar?")) return;
    S = A.map(function () { return [0, 0, 0, 0, 0]; }); C = A.map(function () { return ""; });
    saved = false; lastIdx = -1; msgClear();
    $("est").value = ""; $("proy").value = ""; render(); scrollTo(0, 0);
  });
  function msgClear() { say(""); }

  /* ===== Imprimir / PDF ===== */
  function bajarPDF(h, nombre, hist) {
    if (typeof html2pdf === "undefined") {
      alert("Para descargar directo se necesita internet. Se abrirá la impresión: elige “Guardar como PDF”.");
      document.body.classList.toggle("imp-hist", !!hist); window.print(); return;
    }
    var done = function () { h.classList.remove("pdf"); };
    h.classList.add("pdf");
    html2pdf().set({ margin: 10, filename: "Evaluacion_" + (nombre || "defensa").replace(/\s+/g, "_") + ".pdf", image: { type: "jpeg", quality: .98 }, html2canvas: { scale: 2, scrollX: 0, scrollY: 0, windowWidth: 900 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(h).save().then(done, done);
  }
  $("btn-imprimir").addEventListener("click", function () { minimizar(false); document.body.classList.remove("imp-hist"); window.print(); });
  $("btn-pdf").addEventListener("click", function () { minimizar(false); bajarPDF($("hoja"), $("est").value.trim()); });

  /* ===== Historial: ver documento guardado ===== */
  function abrirDoc(k) {
    if (!R[k] || !R[k].h) return;
    curH = k; $("hoja-h").innerHTML = R[k].h; $("modal-tit").textContent = "📄 " + R[k].n + (R[k].d ? " · " + R[k].d : "");
    $("modal").hidden = false; $("modal").scrollTop = 0;
  }
  function cerrarDoc() { $("modal").hidden = true; document.body.classList.remove("imp-hist"); curH = -1; }
  $("m-cerrar").addEventListener("click", cerrarDoc);
  $("modal").addEventListener("click", function (e) { if (e.target === this) cerrarDoc(); });
  document.addEventListener("keydown", function (e) { if (e.key == "Escape" && !$("modal").hidden) cerrarDoc(); });
  $("m-imp").addEventListener("click", function () { document.body.classList.add("imp-hist"); window.print(); });
  $("m-pdf").addEventListener("click", function () { if (curH >= 0) bajarPDF($("hoja-h"), R[curH].n, true); });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imp-hist"); });

  /* ===== Minimizar ===== */
  function minimizar(on) {
    document.body.classList.toggle("mini", on); $("mini").hidden = !on;
    $("btn-min").textContent = on ? "⬆️ Expandir" : "🗕 Minimizar";
    if (!on) scrollTo(0, 0);
  }
  $("btn-min").addEventListener("click", function () { minimizar(!document.body.classList.contains("mini")); });
  $("btn-expandir").addEventListener("click", function () { minimizar(false); });

  /* ===== Recuperar borrador ===== */
  var B = rd("borrador", null);
  if (B && B.S && B.S.length === A.length) {
    J = Math.min(5, Math.max(1, +B.J || 1)); jn = B.jn || jn; S = B.S; C = B.C || C;
    $("est").value = B.est || ""; $("proy").value = B.proy || ""; $("nj").value = String(J);
  }

  render(); rank();
})();
