/* ============================================================
   株式会社虹 — site behaviour
   1) header / mobile nav
   2) hero canvas（depth-reveal イントロ ＋ 光の波線）
   3) スクロール連動のヒーロー→ブランドステートメント
   4) IntersectionObserver によるセクションの点灯
   5) Solutions 8工程のタブ切り替え
   6) ナビのホバー：右下から一周する虹の枠
   ============================================================ */
(function () {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smoothstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var rainbowHue = function (xFrac, t, seed, speed) {
    speed = speed || 0.18;
    return ((xFrac * 320 + t * speed * 60 + seed) % 360 + 360) % 360;
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 1. header / nav ─────────────────────────────────── */
  function initHeader() {
    var header = $('.header'), toggle = $('.navtoggle'), nav = $('.nav');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (header) header.classList.toggle('is-scrolled', open || window.scrollY > 40);
      });
      $$('a', nav).forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open'); toggle.classList.remove('is-open');
          if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
        });
      });
    }
  }

  /* ── 4. reveal ───────────────────────────────────────── */
  function initReveal() {
    var targets = $$('.reveal, .row, .field, .band, .steps');
    if (!('IntersectionObserver' in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });

    var flow = $('.flow');
    if (flow) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          $$('.stage', flow).forEach(function (s, i) {
            setTimeout(function () { s.classList.add('is-lit'); }, i * 90);
          });
          fio.unobserve(e.target);
        });
      }, { threshold: 0.3 });
      fio.observe(flow);
    }
  }

  /* ── 5. solutions stages ─────────────────────────────── */
  function initStages() {
    var stages = $$('.stage');
    if (!stages.length) return;
    var no = $('#stageNo'), title = $('#stageTitle'), body = $('#stageBody');
    function select(btn) {
      stages.forEach(function (s) { s.classList.toggle('is-active', s === btn); });
      if (no) no.textContent = btn.dataset.sn + ' ／ LIFECYCLE';
      if (title) title.textContent = btn.dataset.title;
      if (body) body.textContent = btn.dataset.body;
    }
    stages.forEach(function (btn) { btn.addEventListener('click', function () { select(btn); }); });
    select(stages[0]);
  }

  /* ── 2 & 3. hero ─────────────────────────────────────── */
  function initHero() {
    var canvas = $('#heroCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var content = $('.hero__content');
    var story = $('.hero__story');
    var heroLines = $$('.hero__line');
    var storyLines = $$('.hero__story p');
    var W, H, dpr;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    /* --- back layer: grid --- */
    var GRID_COLS = 18, GRID_ROWS = 10, DOT_BASE_R = 1.6;
    var hLines = [], vLines = [], dotFlicker = [];
    for (var r = 0; r < GRID_ROWS; r++) hLines.push({ phase: rand(0, TWO_PI), speed: rand(0.18, 0.42), hue: rand(0, 360) });
    for (var c = 0; c < GRID_COLS; c++) vLines.push({ phase: rand(0, TWO_PI), speed: rand(0.18, 0.42), hue: rand(0, 360) });
    for (var r2 = 0; r2 < GRID_ROWS; r2++) {
      var row = [];
      for (var c2 = 0; c2 < GRID_COLS; c2++) row.push({
        phaseA: rand(0, TWO_PI), phaseB: rand(0, TWO_PI), phaseC: rand(0, TWO_PI),
        speedA: rand(0.16, 0.42), speedB: rand(0.36, 0.88), speedC: rand(0.75, 1.45),
        cutoff: rand(0.42, 0.72), radiusScale: rand(0.72, 1.22), hueShift: rand(-18, 18)
      });
      dotFlicker.push(row);
    }
    function drawGrid(t) {
      var cellW = W / (GRID_COLS - 1), cellH = H / (GRID_ROWS - 1), i, j;
      for (i = 0; i < GRID_ROWS; i++) {
        var ln = hLines[i], a = 0.025 + 0.045 * (0.5 + 0.5 * Math.sin(t * ln.speed + ln.phase));
        ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(W, i * cellH);
        ctx.strokeStyle = 'hsla(' + ((ln.hue + t * 12) % 360) + ', 70%, 62%, ' + a + ')';
        ctx.lineWidth = 0.6; ctx.stroke();
      }
      for (i = 0; i < GRID_COLS; i++) {
        var lv = vLines[i], av = 0.025 + 0.045 * (0.5 + 0.5 * Math.sin(t * lv.speed + lv.phase));
        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, H);
        ctx.strokeStyle = 'hsla(' + ((lv.hue + t * 12) % 360) + ', 70%, 62%, ' + av + ')';
        ctx.lineWidth = 0.6; ctx.stroke();
      }
      for (i = 0; i < GRID_ROWS; i++) for (j = 0; j < GRID_COLS; j++) {
        var m = dotFlicker[i][j], x = j * cellW, y = i * cellH;
        var mixed = (0.5 + 0.5 * Math.sin(t * m.speedA + m.phaseA)) * 0.54
                  + (0.5 + 0.5 * Math.sin(t * m.speedB + m.phaseB)) * 0.34
                  + (0.5 + 0.5 * Math.sin(t * m.speedC + m.phaseC)) * 0.12;
        var pv = clamp((mixed - m.cutoff) / (1 - m.cutoff), 0, 1), pulse = pv * pv * (3 - 2 * pv);
        if (pulse < 0.05) continue;
        var alpha = 0.018 + 0.18 * pulse;
        var radius = DOT_BASE_R * m.radiusScale * (0.45 + 1.05 * pulse) * 1.8;
        var hue = ((i * 23 + j * 17 + t * 18 + m.hueShift) % 360 + 360) % 360;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, TWO_PI);
        ctx.fillStyle = 'hsla(' + hue + ', 82%, 66%, ' + alpha + ')'; ctx.fill();
      }
    }

    /* --- mid layer: wave streams --- */
    var STREAMS = [
      { yBase: 0.45, amp: 0.22, freq: 0.9,  speed: 0.22, lineCount: 18, spread: 0.18, alphaMax: 0.30, lineW: 0.6,  hueSpeed: 0.20, hueOffset: 0 },
      { yBase: 0.46, amp: 0.13, freq: 1.2,  speed: 0.31, lineCount: 10, spread: 0.07, alphaMax: 0.44, lineW: 0.75, hueSpeed: 0.28, hueOffset: 60 },
      { yBase: 0.32, amp: 0.14, freq: 0.65, speed: 0.15, lineCount: 12, spread: 0.13, alphaMax: 0.18, lineW: 0.55, hueSpeed: 0.14, hueOffset: 120 }
    ];
    function waveY(st, xFrac, t, li) {
      var offset = (li / st.lineCount - 0.5) * st.spread * H;
      return st.yBase * H + offset
        + st.amp * H * 0.7 * Math.sin(xFrac * TWO_PI * st.freq) * Math.sin(t * st.speed)
        + st.amp * H * 0.3 * Math.sin(xFrac * TWO_PI * st.freq * 1.6 + li * 0.15) * Math.sin(t * st.speed * 1.37 + 1.1);
    }
    function drawWaveLine(st, li, t) {
      var STEPS = 48, dx = W / STEPS;
      var alpha = st.alphaMax * (0.45 + 0.55 * Math.sin(t * 0.28 + li * 0.4));
      if (alpha < 0.01) return;
      var seed = st.hueOffset + li * (360 / st.lineCount);
      var grad = ctx.createLinearGradient(0, 0, W, 0), STOPS = 5;
      for (var i = 0; i <= STOPS; i++) {
        var f = i / STOPS, a = alpha * Math.min(Math.min(f, 1 - f) * 8, 1);
        grad.addColorStop(f, 'hsla(' + rainbowHue(f, t, seed, st.hueSpeed) + ', 80%, 60%, ' + a + ')');
      }
      ctx.beginPath(); ctx.moveTo(0, waveY(st, 0, t, li));
      for (var s = 1; s <= STEPS; s++) ctx.lineTo(s * dx, waveY(st, s / STEPS, t, li));
      ctx.strokeStyle = grad; ctx.lineWidth = st.lineW; ctx.stroke();
    }
    function drawStreams(t) {
      for (var i = 0; i < STREAMS.length; i++)
        for (var j = 0; j < STREAMS[i].lineCount; j++) drawWaveLine(STREAMS[i], j, t);
    }

    /* --- front layer: glints --- */
    var glints = [];
    for (var g = 0; g < 28; g++) {
      var sIdx = Math.floor(rand(0, 2));
      glints.push({ progress: rand(0, 1), streamIdx: sIdx, lineIdx: Math.floor(rand(0, STREAMS[sIdx].lineCount)),
        speed: rand(0.018, 0.055), life: rand(0, 1), lifeSpeed: rand(0.3, 0.9),
        radius: rand(1.2, 3.0), hue: rand(0, 360), hueSpeed: rand(40, 120) });
    }
    function drawGlints(t) {
      for (var i = 0; i < glints.length; i++) {
        var gl = glints[i];
        gl.progress += gl.speed * 0.016;
        if (gl.progress > 1.05) { gl.progress = -0.05; gl.lineIdx = Math.floor(rand(0, STREAMS[gl.streamIdx].lineCount)); gl.hue = rand(0, 360); }
        gl.life += gl.lifeSpeed * 0.016;
        var st = STREAMS[gl.streamIdx], x = gl.progress * W, y = waveY(st, gl.progress, t, gl.lineIdx);
        var pulse = 0.5 + 0.5 * Math.sin(gl.life * TWO_PI), alpha = pulse * 0.8;
        var hue = (gl.hue + t * gl.hueSpeed) % 360, rr = gl.radius * 3.8;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, rr);
        glow.addColorStop(0, 'hsla(' + hue + ', 95%, 72%, ' + alpha + ')');
        glow.addColorStop(0.4, 'hsla(' + hue + ', 85%, 68%, ' + (alpha * 0.38) + ')');
        glow.addColorStop(1, 'hsla(' + hue + ', 75%, 65%, 0)');
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TWO_PI); ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, gl.radius * 0.7, 0, TWO_PI);
        ctx.fillStyle = 'hsla(' + hue + ', 100%, 90%, ' + (alpha * 0.9) + ')'; ctx.fill();
      }
    }

    /* --- intro: seven depth lines --- */
    var INTRO_PASS = 3.9, INTRO_SETTLE = 1.35, INTRO_TOTAL = INTRO_PASS + INTRO_SETTLE;
    var INTRO_HUES = [0, 28, 52, 126, 188, 222, 276];
    var FOCAL = 0.78, VX = 0.26, VY = 0.48, FX = 0.52, FY = 0.54;
    var introLines = INTRO_HUES.map(function (h, i) {
      return { lane: (i - 3) / 3, hue: h, phase: rand(0, TWO_PI) };
    });
    function project(x, y, z) {
      var scale = FOCAL / Math.max(0.16, z);
      var depthMix = clamp((4.7 - z) / 4.48, 0, 1);
      return { x: W * (lerp(VX, FX, Math.pow(depthMix, 0.72)) + x * scale),
               y: H * (lerp(VY, FY, Math.pow(depthMix, 0.9)) + y * scale), scale: scale };
    }
    function setHeroReveal(t, force) {
      if (!content) return;
      var amount = force ? 1 : smoothstep(1.05, 3.2, t);
      var clip = (1 - amount) * 48;
      content.style.opacity = String(amount);
      content.style.filter = 'blur(' + ((1 - amount) * 18) + 'px)';
      content.style.clipPath = 'inset(0 ' + clip + '% 0 ' + clip + '%)';
    }
    function drawIntroBg(t) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      var hx = W * VX, hy = H * VY;
      var approach = smoothstep(0.15, INTRO_PASS * 0.74, t);
      var vg = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(W, H) * 0.62);
      vg.addColorStop(0, 'rgba(229,246,255,0.62)'); vg.addColorStop(0.32, 'rgba(240,249,255,0.28)'); vg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      var cg = ctx.createRadialGradient(W * 0.53, H * 0.54, 0, W * 0.53, H * 0.54, Math.max(W, H) * 0.48);
      cg.addColorStop(0, 'rgba(255,255,255,0.76)'); cg.addColorStop(0.42, 'rgba(238,248,255,0.18)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.lineCap = 'round';
      for (var i = 0; i < 12; i++) {
        var lane = (i - 5.5) / 5.5;
        var p0 = project(-0.10 + lane * 0.035, 0.02 + Math.abs(lane) * 0.012, 4.55);
        var p1 = project(lane * 0.62, 0.38 + Math.abs(lane) * 0.10, 0.62);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = 'rgba(110,180,230,' + (0.014 + 0.045 * approach * (1 - Math.abs(lane) * 0.55)) + ')';
        ctx.lineWidth = 0.55 + p1.scale * 0.48; ctx.stroke();
      }
      ctx.restore();
    }
    function travelProgress(t) {
      var n = clamp(t / INTRO_PASS, 0, 1);
      return (n < 0.64 ? 0.74 * (1 - Math.pow(1 - n / 0.64, 2.35)) : 0.74 + 0.26 * Math.pow((n - 0.64) / 0.36, 0.66)) * 1.22;
    }
    function introPoint(line, travel, t) {
      var cl = clamp(travel, 0, 1.28);
      var before = clamp(cl, 0, 1), beyond = clamp((cl - 1) / 0.28, 0, 1);
      var orbit = (1 - before) * 0.42;
      var side = line.lane * lerp(0.05, 0.58, before);
      var xBase = lerp(-0.12, side, before) - orbit * Math.cos(before * Math.PI * 1.15 + line.phase * 0.16);
      var yBase = lerp(-0.035, 0.20 + Math.abs(line.lane) * 0.045, before) + line.lane * Math.sin(before * Math.PI) * 0.018;
      var flutter = Math.sin(t * 1.2 + travel * 5.2 + line.phase) * 0.012 * before * (1 - beyond * 0.55);
      return project(xBase + line.lane * 0.22 * beyond,
                     yBase + 0.34 * beyond + Math.abs(line.lane) * 0.08 * beyond + flutter,
                     lerp(4.7, 0.22, Math.pow(before, 1.34)) - beyond * 0.13);
    }
    function drawSegment(line, from, to, t, hue, alpha, lw, glowW) {
      var steps = 70, pts = [], s;
      for (s = 0; s <= steps; s++) pts.push(introPoint(line, lerp(from, to, s / steps), t));
      var first = pts[0], last = pts[pts.length - 1];
      var grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
      grad.addColorStop(0, 'hsla(' + hue + ', 92%, 78%, ' + (alpha * 0.04) + ')');
      grad.addColorStop(0.46, 'hsla(' + hue + ', 94%, 66%, ' + (alpha * 0.26) + ')');
      grad.addColorStop(0.82, 'hsla(' + hue + ', 98%, 58%, ' + (alpha * 0.82) + ')');
      grad.addColorStop(1, 'rgba(255,255,255,' + (alpha * 0.95) + ')');
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'hsla(' + hue + ', 98%, 62%, ' + (alpha * 0.55) + ')'; ctx.shadowBlur = glowW;
      ctx.beginPath();
      for (s = 0; s < pts.length; s++) s === 0 ? ctx.moveTo(pts[s].x, pts[s].y) : ctx.lineTo(pts[s].x, pts[s].y);
      ctx.strokeStyle = grad; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
      return last;
    }
    function drawFlythrough(line, i, t) {
      var travel = travelProgress(Math.max(0, t - i * 0.025));
      if (travel <= 0.002) return;
      var hue = line.hue;
      var afterPass = smoothstep(INTRO_PASS * 0.78, INTRO_TOTAL - 0.30, t);
      var residual = 1 - smoothstep(INTRO_PASS * 0.78, INTRO_TOTAL - 0.34, t);
      var leadAlpha = clamp((travel - 0.10) / 0.72, 0, 1) * (1 - smoothstep(1.03, 1.20, travel));
      var tighten = smoothstep(0.84, 1.18, travel);
      var trailLen = lerp(0.22, 0.56, clamp(travel, 0, 1)) * lerp(1, 0.66, tighten);
      var tStart = Math.max(0, travel - trailLen), tEnd = Math.min(travel, 1.24);
      if (residual > 0.01) drawSegment(line, 0, Math.min(travel, 1.02), t, hue,
        (0.16 + 0.26 * clamp(travel, 0, 1)) * residual, 1.0 + 1.5 * clamp(travel, 0, 1), 8 + 10 * clamp(travel, 0, 1));
      if (tEnd > tStart && leadAlpha > 0.002) {
        var lead = drawSegment(line, tStart, tEnd, t, hue, 0.34 + 0.52 * leadAlpha, 1.6 + 5.8 * leadAlpha, 13 + 28 * leadAlpha);
        var flareA = leadAlpha * (1 - smoothstep(1.0, 1.22, travel));
        if (flareA > 0.002) {
          var fr = 10 + 58 * flareA * lead.scale;
          var flare = ctx.createRadialGradient(lead.x, lead.y, 0, lead.x, lead.y, fr);
          flare.addColorStop(0, 'rgba(255,255,255,' + (0.56 + 0.26 * flareA) + ')');
          flare.addColorStop(0.26, 'hsla(' + hue + ', 100%, 66%, ' + (0.34 * flareA) + ')');
          flare.addColorStop(1, 'hsla(' + hue + ', 100%, 66%, 0)');
          ctx.beginPath(); ctx.arc(lead.x, lead.y, fr, 0, TWO_PI); ctx.fillStyle = flare; ctx.fill();
        }
      }
      if (afterPass > 0.05) drawSegment(line, 0.10, 1.02, t, hue,
        (0.18 + 0.12 * Math.sin(t * 2.1 + i)) * (1 - afterPass), 0.9, 8);
    }

    function drawMain(t) {
      drawGrid(t);
      ctx.save(); drawStreams(t); ctx.restore();
      ctx.save(); drawGlints(t); ctx.restore();
    }
    function drawIntro(t) {
      drawIntroBg(t); setHeroReveal(t);
      var fade = smoothstep(INTRO_PASS * 0.56, INTRO_TOTAL - 0.25, t);
      if (fade > 0.002) { ctx.save(); ctx.globalAlpha = fade; drawMain(Math.max(0, t - INTRO_PASS * 0.56)); ctx.restore(); }
      for (var i = 0; i < introLines.length; i++) drawFlythrough(introLines[i], i, t);
    }

    /* イントロは初回のみ。同一セッションの再訪・アンカー付き遷移では省略する */
    var seen = false;
    try { seen = sessionStorage.getItem('niji_intro') === '1'; } catch (e) {}
    var skipIntro = seen || (window.location.hash && window.location.hash.length > 1);
    try { sessionStorage.setItem('niji_intro', '1'); } catch (e) {}

    var start = null;
    (function frame(ts) {
      if (!start) start = ts;
      var t = (ts - start) * 0.001;
      ctx.clearRect(0, 0, W, H);
      if (!skipIntro && t < INTRO_TOTAL) drawIntro(t);
      else { setHeroReveal(INTRO_TOTAL, true); drawMain(skipIntro ? t : t - INTRO_PASS * 0.56); }
      requestAnimationFrame(frame);
    })(performance.now());

    /* --- 3. scroll scrub: hero → brand statement --- */
    function updateScroll() {
      var maxScrub = window.innerHeight * 1.8;
      var progress = clamp(window.scrollY / maxScrub, 0, 1);
      heroLines.forEach(function (line, idx) {
        var st = idx * 0.08, en = st + 0.20;
        var p = clamp((progress - st) / (en - st), 0, 1);
        var ease = p * p * (3 - 2 * p);
        line.style.clipPath = 'inset(0 0 ' + (ease * 100) + '% 0)';
        line.style.opacity = String(clamp(1 - ease * 1.18, 0, 1));
      });
      if (story) {
        if (progress > 0.95) { story.style.opacity = String(clamp((1 - progress) / 0.05, 0, 1)); }
        else { story.style.opacity = String(clamp((progress - 0.38) / 0.05, 0, 1)); }
      }
      storyLines.forEach(function (line, idx) {
        var st = 0.40 + idx * 0.115, en = st + 0.16;
        var p = clamp((progress - st) / (en - st), 0, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        line.style.opacity = p > 0.10 ? '1' : '0';
        line.style.transform = 'translateY(' + ((1 - ease) * 26) + 'px)';
      });
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    updateScroll();
  }


  /* ── 6. ナビのホバー：右下から一周する虹の枠 ─────────────
     角のある四角を、右下 → 左下 → 左上 → 右上 → 右下 の順に
     7色でつないで一周させる。色ごとに別の線にして、
     順番に遅らせて引くことで「1本の線が回っている」ように見せる。 */
  function initNavBox() {
    /* ロゴの弧から実測した7色。左端の橙から右端の紺まで、
       logo-niji.png の色をそのまま順に並べている。 */
    var NAV_HUES = ['#DD742C', '#EFA53B', '#F6C64A', '#CCD5B8',
                    '#A9D3EC', '#5C93CE', '#2559A6'];
    var SEGS = NAV_HUES.length;
    var LAP  = 0.38;                       // 一周にかける秒数
    var NS   = 'http://www.w3.org/2000/svg';
    var links = $$('.nav a:not(.btn-contact)');
    if (!links.length) return;

    /* 右下から時計回りに、周長 d の位置の座標 */
    function corners(w, h) {
      return [[w, h], [0, h], [0, 0], [w, 0], [w, h]];
    }
    function build(link) {
      var old = link.querySelector('.navbox');
      if (old) old.parentNode.removeChild(old);

      var r = link.getBoundingClientRect();
      var w = Math.round(r.width) + 22, h = Math.round(r.height) + 16;
      if (w < 8 || h < 8) return;

      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'navbox');
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      var C = corners(w, h);
      var edge = [w, h, w, h];                       // 下・左・上・右 の長さ
      var acc  = [0, w, w + h, 2 * w + h, 2 * w + 2 * h];
      var P = acc[4];

      function at(d) {                               // 周長 d の座標
        var i = 0;
        while (i < 3 && d > acc[i + 1]) i++;
        var t = edge[i] ? (d - acc[i]) / edge[i] : 0;
        return [C[i][0] + (C[i + 1][0] - C[i][0]) * t,
                C[i][1] + (C[i + 1][1] - C[i][1]) * t];
      }

      var i, d0, d1, pts, k, dd, path, len, prev;
      for (i = 0; i < SEGS; i++) {
        d0 = P * i / SEGS; d1 = P * (i + 1) / SEGS;
        pts = [at(d0)];
        for (k = 1; k <= 3; k++) {                   // 途中の角を拾う
          if (acc[k] > d0 && acc[k] < d1) pts.push(C[k]);
        }
        pts.push(at(d1));

        path = document.createElementNS(NS, 'path');
        path.setAttribute('d', 'M' + pts.map(function (p) {
          return p[0].toFixed(1) + ',' + p[1].toFixed(1);
        }).join('L'));
        path.setAttribute('stroke', NAV_HUES[i]);
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        /* 実際の長さで dash を組む。線が伸びる速さが全周で一定になる */
        len = 0; prev = pts[0];
        for (k = 1; k < pts.length; k++) {
          len += Math.abs(pts[k][0] - prev[0]) + Math.abs(pts[k][1] - prev[1]);
          prev = pts[k];
        }
        /* offset は CSS 側で切り替えるので、長さだけ変数で渡す
           （インラインで offset を書くと :hover の指定が効かない） */
        path.style.setProperty('--len', len);
        path.style.transitionDuration = (LAP / SEGS).toFixed(3) + 's';
        path.style.transitionDelay    = (LAP * i / SEGS).toFixed(3) + 's';
        path.style.transitionTimingFunction = 'linear';
        svg.appendChild(path);
      }
      link.appendChild(svg);
    }

    function buildAll() { links.forEach(build); }
    buildAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(buildAll, 200);
    });
  }

  function boot() { initHeader(); initReveal(); initStages(); initHero(); initNavBox(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
