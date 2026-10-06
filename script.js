// ¿Quién lo dijo?: 10 frases diarias iguales para todos, y luego modo libre.
var EPOCA = Date.UTC(2026, 9, 6), RONDAS = 10;
function $(id) { return document.getElementById(id); }
var hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
var dia = Math.floor((Date.parse(hoy + 'T00:00:00Z') - EPOCA) / 86400000);
var AUTORES = FRASES.map(function (f) { return f[1]; }).filter(function (a, i, arr) { return arr.indexOf(a) === i; });

function rng(semilla) {
  var s = (semilla * 2654435761) % 4294967296;
  return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
function barajar(a, r) {
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function preguntas(semilla, n) {
  var r = rng(semilla);
  return barajar(FRASES.map(function (_, i) { return i; }), r).slice(0, n).map(function (i) {
    var f = FRASES[i];
    var otros = barajar(AUTORES.filter(function (a) { return a !== f[1]; }), r).slice(0, 3);
    return { i: i, opciones: barajar(otros.concat([f[1]]), r) };
  });
}

var libre = false, P = preguntas(dia + 1, RONDAS), ronda = 0, resultados = [];
try { var g = JSON.parse(localStorage.getItem('quien-lo-dijo')); if (g && g.dia === dia) { resultados = g.r; ronda = g.r.length; } } catch (e) {}
function guardar() { if (!libre) try { localStorage.setItem('quien-lo-dijo', JSON.stringify({ dia: dia, r: resultados })); } catch (e) {} }

function pintar() {
  $('numero').textContent = '#' + (dia + 1);
  var fin = !libre && ronda >= RONDAS;
  $('final').hidden = !fin;
  $('caja').hidden = fin; $('opciones').hidden = fin; $('siguiente').hidden = true;
  if (fin) {
    var ok = resultados.filter(Boolean).length;
    $('progreso').textContent = 'terminado';
    $('finalTit').textContent = ok + ' de ' + RONDAS;
    $('finalTxt').textContent = ok >= 9 ? 'Eres una hemeroteca andante.' : ok >= 6 ? 'Nada mal.' : 'Hay que ver más telediarios.';
    return;
  }
  if (libre && ronda >= P.length) { P = P.concat(preguntas(Date.now() % 100000, 20)); }
  var p = P[ronda], f = FRASES[p.i];
  $('progreso').textContent = libre ? 'modo libre' : (ronda + 1) + ' de ' + RONDAS;
  $('frase').textContent = f[0];
  $('contexto').textContent = '';
  $('opciones').innerHTML = p.opciones.map(function (o, k) { return '<button class="opcion" data-k="' + k + '"></button>'; }).join('');
  $('opciones').querySelectorAll('.opcion').forEach(function (b) { b.textContent = p.opciones[+b.dataset.k]; });
}

$('opciones').addEventListener('click', function (e) {
  var b = e.target.closest('.opcion');
  if (!b || b.disabled) return;
  var p = P[ronda], f = FRASES[p.i], bien = p.opciones[+b.dataset.k] === f[1];
  $('opciones').querySelectorAll('.opcion').forEach(function (x) {
    x.disabled = true;
    if (p.opciones[+x.dataset.k] === f[1]) x.classList.add('ok');
  });
  if (!bien) b.classList.add('mal');
  $('contexto').textContent = f[1] + '. ' + f[2] + '.';
  if (!libre) { resultados.push(bien); guardar(); }
  $('siguiente').hidden = false;
});
$('siguiente').addEventListener('click', function () { ronda++; pintar(); });
$('libre').addEventListener('click', function () { libre = true; P = preguntas(Date.now() % 100000, 20); ronda = 0; pintar(); });
$('compartir').addEventListener('click', function () {
  var txt = '💬 ¿Quién lo dijo? #' + (dia + 1) + ': ' + resultados.filter(Boolean).length + '/' + RONDAS + '\n' +
    resultados.map(function (r) { return r ? '🟩' : '🟥'; }).join('') + '\n' + location.href.split('#')[0];
  if (navigator.share) navigator.share({ text: txt }).catch(function () {});
  else navigator.clipboard.writeText(txt).then(function () { $('compartir').textContent = 'Copiado'; });
});
pintar();
