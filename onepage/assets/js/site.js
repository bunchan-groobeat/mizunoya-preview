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
    initThemeToggle();
  });
})();
