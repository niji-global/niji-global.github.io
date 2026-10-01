/* ============================================================
   株式会社虹 — Company の導入（アイキャッチ）

   NIJI_Logo_Motion から、弧が引かれて「Niji」の文字が出そろう
   ところまでを切り出した約2.4秒。ページと同じ白地の面に、
   小さく中央に置く。

   再生し終えたら、ロゴの輪郭がほどけて（blur）少し広がりながら
   消える。その裏で地が明け、Company の内容が立ち上がる。
   ============================================================ */
(function () {
  'use strict';

  var HOLD_AFTER = 180;   // 再生し終えてから、滲んで消えはじめるまで（ms）
  var HARD_STOP  = 5000;  // 何かあっても必ず明ける（ms）

  function boot() {
    var root  = document.documentElement;
    var veil  = document.getElementById('introVeil');
    var video = document.getElementById('introVideo');
    var fig   = veil ? veil.querySelector('.introfig') : null;

    function settle() {
      if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
      root.classList.remove('intro-lock', 'intro-on');
      root.classList.add('intro-settled');
    }

    if (!veil || !video || !root.classList.contains('intro-on')) { settle(); return; }

    /* 動画を、同じ絵の透過PNGに差し替える。ここは一瞬で、
       同じコマなので見た目は変わらない。以降のぼかしはPNG側にかかる。 */
    function toStill() {
      if (fig && !fig.classList.contains('is-still')) fig.classList.add('is-still');
    }

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      toStill();
      /* 差し替えを1フレーム描かせてから、消えるアニメーションに入る */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { veil.classList.add('is-done'); });
      });
      root.classList.remove('intro-lock');
      root.classList.add('intro-settled');      // 見出しがそっと立ち上がる
      setTimeout(function () {
        if (veil.parentNode) veil.parentNode.removeChild(veil);
        root.classList.remove('intro-on');
      }, 1400);
    }

    /* 触られたら飛ばす */
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, finish, { once: true, passive: true });
    });
    setTimeout(finish, HARD_STOP);

    video.addEventListener('ended', function () { setTimeout(finish, HOLD_AFTER); });
    video.addEventListener('error', finish);

    /* autoplay 属性が効かない環境でも自分で再生を試みる。
       それでも駄目なら待たせずに明ける。 */
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { setTimeout(finish, 500); });
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
