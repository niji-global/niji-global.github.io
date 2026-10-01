/* ============================================================================
   APPROACH：大きな円の弧を、場面がめぐってくる

   ・画面より大きな円の上端（弧）に場面を並べ、スクロールに合わせて円が回る。
     頂上に来た場面が大きくなり、その下に工程名と説明が出る。
   ・場面は円周上をめぐり続ける：最後の場面のあと、01 がもう一度頂上へ戻って一周が閉じる。
   ・スクロール量は目標値として扱い、表示は毎フレーム少しずつ追いかける
     （トラックパッドの細かい揺れが回転に出ないように）。
   ・PC（幅961px以上・マウス操作）でだけ有効。それ以外は CSS の並びのまま。
     「視差効果を減らす」の設定では分岐しない（利用者自身のスクロールに連動する動きのため）。
   ============================================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-orbit]');
  if (!root) return;
  var stage = root.querySelector('.orbit__stage');
  var steps = [].slice.call(root.querySelectorAll('.step'));
  var ring = root.querySelector('.orbit__ring');
  var ringC = ring && ring.querySelector('circle');
  var countB = root.querySelector('.orbit__count b');
  var N = steps.length;
  if (!stage || N < 2) return;

  var mq = window.matchMedia('(min-width: 961px) and (hover: hover)');
  var STEP_DEG = 24;                 /* 隣の場面との角度（弧の上での間隔） */
  var FOLLOW = 0.12;                 /* 表示が目標へ寄る速さ（60fps基準） */
  var STEP_VH = 34;                  /* 1場面ぶんのスクロール量（vh） */
  var LAST = 0.6;                    /* 最後の 05→01 の戻りは短く（1場面ぶんの0.6） */
  var geo = null, raf = 0, on = false, last = -1;
  var target = 0, shown = 0, lastT = 0;

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function measure() {
    var w = stage.clientWidth, h = stage.clientHeight;
    var hc = 300 * 660 / 816 / 2;                    /* 頂上の場面（幅300px）の高さの半分 */
    var R = Math.max(w * 0.78, 980);                 /* 画面より大きな円 */
    var apexY = Math.round(h * 0.22 + hc);           /* 頂上にある場面の、イラスト中心の高さ */
    geo = { w: w, h: h, R: R, cx: w / 2, cy: apexY + R, hc: hc };
    if (ring) {
      ring.setAttribute('width', w); ring.setAttribute('height', h);
      ringC.setAttribute('cx', geo.cx); ringC.setAttribute('cy', geo.cy); ringC.setAttribute('r', R);
    }
    steps.forEach(function (el) { el.style.transformOrigin = '50% ' + hc.toFixed(1) + 'px'; });
  }

  /* 0..1 のスクロール → 0..N の位置。各場面で少し止まり、最後は短い区間で 01 に戻る */
  function scrollTarget() {
    var r = root.getBoundingClientRect();
    var span = root.offsetHeight - stage.offsetHeight;
    var p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
    var s = p * (N - 1 + LAST), k = Math.floor(s), f = s - k;
    if (k >= N - 1) { f = Math.min(1, (s - (N - 1)) / LAST); return N - 1 + smooth(0.15, 0.85, f); }
    return k + smooth(0.3, 0.7, f);
  }

  function draw() {
    var pos = shown;
    var active = ((Math.round(pos) % N) + N) % N;
    for (var i = 0; i < N; i++) {
      var d = i - pos;
      d = d - N * Math.round(d / N);                    /* 円をめぐるので、最寄りの位置に折り返す */
      var th = d * STEP_DEG * Math.PI / 180;
      var x = geo.cx + geo.R * Math.sin(th);
      var y = geo.cy - geo.R * Math.cos(th);
      var near = Math.max(0, 1 - Math.abs(d));          /* 1=頂上 */
      var sc = 0.56 + 0.44 * near;
      var el = steps[i];
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,' + (-geo.hc).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      el.style.opacity = (Math.abs(d) > 2.3 ? 0 : (0.32 + 0.68 * near)).toFixed(3);
      el.style.setProperty('--txt', near.toFixed(3));
      el.classList.toggle('is-active', i === active);
    }
    if (countB && active !== last) { countB.textContent = ('0' + (active + 1)).slice(-2); last = active; }
  }

  function loop(now) {
    raf = 0;
    if (!on) return;
    var dt = lastT ? Math.min((now - lastT) / 16.7, 4) : 1;
    lastT = now;
    var k = 1 - Math.pow(1 - FOLLOW, dt);
    var diff = target - shown;
    if (Math.abs(diff) < 0.0008) { shown = target; draw(); lastT = 0; return; }
    shown += diff * k;
    draw();
    raf = requestAnimationFrame(loop);
  }
  function onScroll() { target = scrollTarget(); if (!raf) raf = requestAnimationFrame(loop); }

  function enable() {
    on = true; root.classList.add('orbit--on');
    root.style.height = (100 + STEP_VH * (N - 1 + LAST)) + 'vh';   /* 固定区間：約1.6画面 */
    measure(); target = shown = scrollTarget(); draw();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  function disable() {
    on = false; root.classList.remove('orbit--on'); root.style.height = '';
    steps.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; el.classList.remove('is-active'); });
    window.removeEventListener('scroll', onScroll);
  }
  function apply() { if (mq.matches) { if (!on) enable(); else { measure(); draw(); } } else if (on) disable(); }

  apply();
  window.addEventListener('resize', function () { if (on) { measure(); draw(); } });
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
})();
