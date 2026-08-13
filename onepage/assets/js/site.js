/* =========================================================
   水野谷自動車HP 新版 — 共通スクリプト（A/B共通・挙動のみ）
   2026-07-30 ルイージ作成（Lane A）
   ---------------------------------------------------------
   ★挙動（ナビ開閉・フォーム非同期送信・トップ戻り）のみ。演出（アニメの見た目）は
     A/B選定後に別途。ここに色・書体・装飾は関与しない。
   ★フォーム送信先は現行版と同じく Formspree。本番IDは社長支給後に config で差し替え。
========================================================= */
(function () {
  'use strict';

  /* ---- モバイルナビ開閉 ---- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.global-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    /* ページ内アンカーをタップしたらメニューを閉じてジャンプ */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- お問い合わせフォーム（Formspree 非同期送信・現行版の挙動を踏襲） ---- */
  function initContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type=submit]');
    function showStatus(msg, type) { if (!status) return; status.textContent = msg; status.className = 'form-status is-' + type; status.hidden = false; }
    var configured = form.action.indexOf('YOUR_FORM_ID') === -1 && /formspree\.io\/f\//.test(form.action);
    form.addEventListener('submit', function (e) {
      if (!configured) { e.preventDefault(); showStatus('送信先が未設定です。管理者にご連絡ください。', 'error'); return; }
      if (!window.fetch) return;
      e.preventDefault(); button.disabled = true; showStatus('送信中です…', 'pending');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (res.ok) { form.reset(); showStatus('お問い合わせを送信しました。ご返信まで少々お待ちください。', 'success'); }
          else { return res.json().then(function (data) { var msg = (data && data.errors && data.errors.length) ? data.errors.map(function (x) { return x.message; }).join(' / ') : '送信に失敗しました。時間をおいて再度お試しください。'; showStatus(msg, 'error'); }); }
        })
        .catch(function () { showStatus('通信エラーが発生しました。時間をおいて再度お試しください。', 'error'); })
        .then(function () { button.disabled = false; });
    });
  }

  /* ---- A/B比較トグル（顧客提示・比較用。JSライブ切替＋localStorage永続化。最終版では削除する） ---- */
  function applyTheme(t) {
    t = (t === 'B') ? 'B' : 'A';
    document.documentElement.setAttribute('data-theme', t);
    var link = document.getElementById('theme-css');
    if (link) link.setAttribute('href', 'assets/css/tokens-' + t + '.css');
    try { localStorage.setItem('mizTheme', t); } catch (e) {}
    var btns = document.querySelectorAll('.theme-toggle a');
    Array.prototype.forEach.call(btns, function (a) {
      if (a.getAttribute('data-theme') === t) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  function initThemeToggle() {
    var t = (document.documentElement.getAttribute('data-theme') || 'A');
    var box = document.createElement('div');
    box.className = 'theme-toggle';
    box.setAttribute('aria-label', 'デザイン比較（A/B）');
    box.innerHTML = '<span class="tt-label">デザイン比較</span>' +
      '<a href="?theme=A" data-theme="A"' + (t === 'A' ? ' aria-current="true"' : '') + '>A ネオクラシック</a>' +
      '<a href="?theme=B" data-theme="B"' + (t === 'B' ? ' aria-current="true"' : '') + '>B モダン</a>';
    box.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-theme]');
      if (!a) return;
      e.preventDefault();
      applyTheme(a.getAttribute('data-theme'));
    });
    document.body.appendChild(box);
  }

  /* ---- トップの見出しを1文字ずつ打ち込む演出（★2026-08-10 社長指示） ----
     対象＝トップの「クルマのこと、まるごと。」（.hero--full .hero-copy）。

     ★設計の考え方：
       ・HTMLの文字は消さない。1文字ずつ <span> で包み、CSSで透明にしてから順に見せる。
         → JSが動かない環境・検索エンジン・読み上げソフトには最初から全文が存在する
           （文字を後から流し込む方式にすると、JSが失敗した瞬間に見出しが消える）。
       ・<br> はそのまま残す（改行位置を壊さない）。
       ・打ち終わってから、リード文とボタンを出す。
         先に見えていると「打っている途中なのに続きがある」不自然さが出るため。
       ・動きを減らす設定の方には演出しない（即座に全部表示）。 */
  function initTypewriter() {
    var el = document.querySelector('.hero--full .hero-copy');
    if (!el) return;

    var hero = el.closest('.hero-text');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* 動きを減らす設定・古いブラウザでは、演出せずそのまま見せる */
    if (reduce || !window.requestAnimationFrame) {
      if (hero) hero.classList.add('is-typed');
      return;
    }

    /* ★ここまで来た＝演出できると確定した時点で初めて <html> に js-tw を付ける。
       CSS側はこのクラスが付いているときだけリード文・ボタンを隠す。
       先に隠してからJSで出す作りにすると、JSが止まった瞬間に
       電話番号もお問い合わせボタンも見えないページになる。 */
    document.documentElement.classList.add('js-tw');

    /* 文字を1つずつ span に包む。<br> は要素のまま維持する */
    var frag = document.createDocumentFragment();
    var chars = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        /* テキストノード：1文字ずつ span 化 */
        node.textContent.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'tw-char';
          s.textContent = ch;
          chars.push(s);
          frag.appendChild(s);
        });
      } else {
        /* <br> などはそのまま */
        frag.appendChild(node.cloneNode(true));
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('is-typing');

    /* 1文字あたりの間隔。★2026-08-10 社長指示でゆっくりに（105ms → 165ms）。
       12文字なので 165ms × 12 ≒ 2.0秒。写真をしっかり見せてから文字が置かれていく速さ。 */
    var STEP = 165;
    var START_DELAY = 600; /* 写真が見えてから打ち始める（少し余裕をとる） */

    chars.forEach(function (s, i) {
      setTimeout(function () { s.classList.add('is-on'); }, START_DELAY + i * STEP);
    });

    /* 打ち終わったらリード文・ボタンを出す */
    setTimeout(function () {
      if (hero) hero.classList.add('is-typed');
    }, START_DELAY + chars.length * STEP + 120);
  }

  /* ---- スクロールで各セクションをふわりと出す（★2026-08-13 社長指示） ----
     ★大前提はタイプライター演出と同じ＝**JSが動かないときは何も隠さない**。
       CSSに素で opacity:0 を書くと、JSが読み込めなかった瞬間にページが真っ白になる。
       そのため <html> に .js-reveal を付けたときだけ隠れる書き方にしている。
     ★動きを減らす設定の方には最初から適用しない（クラスを付けずに抜ける）。
     ★IntersectionObserver が無い古いブラウザでも、同じ理由でそのまま全部見える。
     ★一度出したら監視をやめる（戻ってきたときに再び消えるのは煩わしいため）。 */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    /* ヒーローは最初から見えている場所なので対象にしない（読み込み直後に消えるのを避ける） */
    var targets = document.querySelectorAll('#main .section');
    if (!targets.length) return;

    document.documentElement.classList.add('js-reveal');

    /* ★「1回だけ」か「毎回」かを <html data-reveal-repeat> で切り替える。
         既定（属性なし）＝1回だけ出したらそのまま。戻るたびに内容が消えて出直すのは煩わしいため。
         属性あり＝画面から外れると元に戻し、再び入るともう一度動く。
       ★unobserve は使わない。使うと「毎回」へ切り替えても、既に出た要素が二度と動かなくなる。
         監視対象はセクション数個なので、監視を続けても負荷は問題にならない。
       ★判定はコールバックの中で毎回読む＝実行中に切り替えても効く。 */
    var io = new IntersectionObserver(function (entries) {
      var repeat = document.documentElement.hasAttribute('data-reveal-repeat');
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-revealed');
        else if (repeat) e.target.classList.remove('is-revealed');
      });
    }, {
      /* 画面の下から少し入った時点で出す。0にすると端に触れた瞬間に始まって唐突に見える。
         ★2026-08-13「わかりづらい」→ -12% から -20% へ。
           画面のより内側に入ってから動き始めるので、動いたことに気づきやすい
           （端で始まると、目に入ったときには終わっている）。 */
      rootMargin: '0px 0px -20% 0px',
      threshold: 0.05,
    });

    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ---- ページ上部へ戻る ---- */
  function initReturnTop() {
    var btn = document.querySelector('.return-top');
    if (!btn) return;
    btn.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initContactForm();
    initReturnTop();
    initReveal();
    initThemeToggle();
    initTypewriter();
  });
})();
