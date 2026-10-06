/* Google Analytics 4
   測定ID（G- から始まる）を下の GA_ID に入れると計測が始まります。
   未設定のまま、またはローカルで開いたときは何も読み込みません。 */
(function () {
  'use strict';
  var GA_ID = 'G-GZ9GZ4B8DF';
  if (!/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;
  var HOSTS = ['niji-global.com', 'www.niji-global.com'];   /* 計測する本番のホスト名 */
  if (HOSTS.indexOf(location.hostname) < 0) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { allow_google_signals: false });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  /* 問い合わせ・資料請求の送信成功（Web3Forms が success を返したときだけ contact.html が印を付ける）。
     完了ページで印を1回だけ読み、成果イベント generate_lead を送る。直接開いた・再読み込みでは数えない */
  try {
    var lead = sessionStorage.getItem('niji_lead');
    if (lead && /\/contact-complete\.html$/.test(location.pathname)) {
      sessionStorage.removeItem('niji_lead');
      gtag('event', 'generate_lead', { form_type: lead === 'doc' ? 'doc' : 'contact' });
    }
  } catch (e) {}

  /* お問い合わせへの導線と、製品詳細への導線のクリックを記録する */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    var sec = a.closest('section[id]');
    var where = sec ? sec.id : (a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : '');
    if (/contact\.html/.test(href)) {
      var m = href.match(/topic=([a-z]+)/), ty = href.match(/type=([a-z]+)/);
      gtag('event', 'contact_click', { link_text: text, section: where, topic: m ? m[1] : '', form_type: ty ? ty[1] : 'contact' });
    } else if (/brand-trust-platform/.test(href)) {
      gtag('event', 'product_click', { link_text: text, section: where, link_url: href });
    }
  }, true);
})();
