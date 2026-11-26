/* Gedeelde meetlaag voor de drie sites. Alleen vaste labels; nooit veldinhoud.
 * Zelfde bestand in iedere repo. Meten begint uitsluitend na toestemming.
 */
(() => {
  'use strict';
  if (window.siteMeting) return;
  const script = document.currentScript;
  const site = script?.dataset.site;
  const id = script?.dataset.ga;
  const domains = { avi: 'adviesvooriedereen.nl', hs: 'hendrikschakel.nl', fo: 'benikfinancieelonafhankelijk.nl' };
  const domain = domains[site];
  const test = script?.dataset.test === 'true' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (!domain || !/^G-[A-Z0-9]+$/.test(id || '') || (!test && location.hostname !== domain && location.hostname !== `www.${domain}`)) return;
  const key = `${site}-meting-keuze-v1`;
  const events = new Set(['page_view', 'article_engaged', 'next_article_click', 'reading_mode_changed', 'read_aloud_start', 'read_aloud_complete', 'read_aloud_error', 'video_start', 'video_complete', 'video_error', 'feedback_helpful', 'feedback_unhelpful', 'contact_email_click', 'tool_start', 'tool_result', 'tool_error', 'tool_export', 'tool_no_response', 'form_start', 'form_invalid', 'form_submit_attempt', 'form_no_response', 'form_received', 'form_error', 'form_abandon', 'booking_cta_click', 'booking_panel_open', 'booking_slot_selected', 'booking_confirmed', 'booking_error', 'contact_success', 'waitlist_requested', 'client_error']);
  const labels = {
    form_id: new Set(['contact', 'booking', 'waitlist']),
    tool_id: new Set(['fo-planner', 'bruto-netto', 'jaarruimte', 'inflatie', 'box3', 'maandelijks-beleggen', 'rente-op-rente']),
    reading_mode: new Set(['gewoon', 'makkelijk']),
    field_group: new Set(['naam', 'email', 'telefoon', 'onderwerp', 'bericht', 'toestemming', 'overig']),
    error_type: new Set(['network', 'timeout', 'validation', 'verification', 'server', 'calculation', 'script', 'resource', 'promise', 'media', 'unknown']),
    step: new Set(['input', 'verification', 'request', 'result', 'confirmation', 'export']),
    file_type: new Set(['pdf', 'xlsx']),
    method: new Set(['video', 'phone']),
    via: new Set(['first_free', 'picker']),
  };
  let granted = false;
  let loaded = false;
  let lastPath = '';
  let activeSeconds = 0;
  let engaged = false;
  let clientErrors = 0;
  const forms = new Map();
  const tools = new Map();
  const emitted = new Set();
  let panel;

  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      const age = Date.now() - value?.at;
      return value && ['yes', 'no'].includes(value.choice) && Number.isFinite(age) && age >= 0 && age < 180 * 86400000 ? value.choice : null;
    } catch { return null; }
  }
  function path() {
    // Ook padsegmenten kunnen persoonsgegevens bevatten. Alleen openbare paden.
    let p = location.pathname;
    if (/@|%40|%2f|%5c/i.test(p) || p.length > 180 || !/^\/[a-z0-9/_.-]*$/i.test(p)) return '/overig';
    if (/^\/(api|reschedule|confirm|cancel)(\/|$)/.test(p)) return '/afspraak';
    return p;
  }
  function emit(name, params = {}, eventPath = path()) {
    if (!granted || !events.has(name)) return;
    const clean = { site_id: site, page_location: `https://${domain}${eventPath}`, page_referrer: referrer(), page_title: `${domain}${eventPath}` };
    for (const [k, allowed] of Object.entries(labels)) if (allowed.has(params[k])) clean[k] = params[k];
    if (Number.isInteger(params.http_status) && params.http_status >= 400 && params.http_status <= 599) clean.http_status = params.http_status;
    if (test) clean.debug_mode = true;
    // Geen willekeurige parameters, URL-query's, titels, stacktraces of teksten.
    window.gtag?.('event', name, clean);
  }
  function once(name, params = {}) {
    const k = JSON.stringify([path(), name, params]);
    if (!granted || emitted.has(k)) return;
    emitted.add(k);
    emit(name, params);
  }
  function referrer() {
    try { return document.referrer ? new URL(document.referrer).origin : ''; } catch { return ''; }
  }
  function page() {
    const next = path();
    if (!granted || lastPath === next) return;
    abandon();
    lastPath = next;
    activeSeconds = 0;
    engaged = false;
    clientErrors = 0;
    emitted.clear();
    emit('page_view');
  }
  function load() {
    if (loaded) return;
    loaded = true;
    window[`ga-disable-${id}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    // Ook de initialisatie van de tag krijgt veilige standaardwaarden, voordat
    // Google-code laadt. Zo zijn we niet alleen afhankelijk van stream-config.
    const defaults = { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 31536000, cookie_update: false, page_location: `https://${domain}${path()}`, page_referrer: referrer(), page_title: `${domain}${path()}` };
    window.gtag('set', defaults);
    window.gtag('js', new Date());
    window.gtag('config', id, defaults);
    const tag = document.createElement('script');
    tag.async = true;
    tag.id = 'site-meting-google';
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(tag);
  }
  function clearCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const d of ['', location.hostname, `.${domain}`]) {
        document.cookie = `${name}=; Max-Age=0; Path=/;${d ? ` Domain=${d};` : ''} SameSite=Lax`;
      }
    }
  }
  function choose(choice) {
    const wasLoaded = loaded;
    try { localStorage.setItem(key, JSON.stringify({ choice, at: Date.now() })); } catch { /* Werkt ook zonder opslag. */ }
    granted = choice === 'yes';
    window.dispatchEvent(new Event('site-meting-consent'));
    panel.hidden = true;
    panel.querySelector('[data-close]').hidden = false;
    if (granted) { load(); page(); }
    else {
      window[`ga-disable-${id}`] = true;
      for (const state of forms.values()) clearTimeout(state.timer);
      for (const state of tools.values()) clearTimeout(state.timer);
      forms.clear(); tools.clear(); emitted.clear();
      document.getElementById('site-meting-google')?.remove();
      clearCookies();
      // Een geladen Google-script kan niet worden ontladen. Herladen beëindigt het.
      if (wasLoaded) location.reload();
    }
  }
  function ui() {
    panel = document.createElement('section');
    panel.className = 'meting-banner';
    const english = site === 'hs' && document.documentElement.lang !== 'nl';
    panel.setAttribute('aria-label', english ? 'Visitor statistics choice' : 'Keuze voor bezoekersstatistieken');
    panel.innerHTML = english
      ? '<div class="meting-inner"><p>May we measure your visit with Google Analytics to improve this site? Google receives visit data and sets cookies. We never send what you enter in forms. <a href="/privacy">Read about privacy</a>.</p><div class="meting-buttons"><button type="button" data-no>Decline</button><button type="button" data-yes>Allow</button><button type="button" data-close hidden>Close</button></div></div>'
      : '<div class="meting-inner"><p>We willen de site beter maken. Mogen we je bezoek meten met Google Analytics? Google krijgt dan gegevens over je bezoek en plaatst cookies. Je ingevulde gegevens sturen we niet mee. <a href="/privacy">Lees over privacy</a>.</p><div class="meting-buttons"><button type="button" data-no>Weigeren</button><button type="button" data-yes>Toestaan</button><button type="button" data-close hidden>Sluiten</button></div></div>';
    panel.querySelector('[data-no]').addEventListener('click', () => choose('no'));
    panel.querySelector('[data-yes]').addEventListener('click', () => choose('yes'));
    panel.querySelector('[data-close]').addEventListener('click', () => { panel.hidden = true; });
    document.body.append(panel);
    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('[data-meting-settings]')) {
        e.preventDefault();
        panel.hidden = false;
        panel.querySelector('button').focus();
      }
    });
    const choice = readChoice();
    panel.hidden = choice !== null;
    panel.querySelector('[data-close]').hidden = choice === null;
    if (choice === 'yes') { granted = true; load(); page(); }
    window.dispatchEvent(new Event('site-meting-consent'));
  }

  function formStart(formId) {
    if (!granted || !labels.form_id.has(formId)) return null;
    if (!forms.has(formId)) { forms.set(formId, { path: path(), started: true, pending: false, received: false, timer: 0 }); emit('form_start', { form_id: formId }); }
    return forms.get(formId);
  }
  function formSubmit(formId) {
    const state = formStart(formId);
    if (!state) return;
    clearTimeout(state.timer);
    state.pending = true;
    state.received = false;
    emit('form_submit_attempt', { form_id: formId });
    state.timer = setTimeout(() => { if (granted && state.pending) emit('form_no_response', { form_id: formId, step: 'request', error_type: 'timeout' }); }, 15000);
  }
  function formResult(formId, ok, errorType = 'unknown', status) {
    const state = forms.get(formId);
    if (!granted || !state) return;
    if (state.received && ok) return;
    clearTimeout(state.timer);
    state.pending = false;
    state.received = ok;
    emit(ok ? 'form_received' : 'form_error', { form_id: formId, error_type: ok ? undefined : errorType, http_status: status });
  }
  function toolId() {
    if (site !== 'fo') return null;
    const p = path().replace(/\/$/, '');
    if (p === '/ben-ik-financieel-onafhankelijk') return 'fo-planner';
    const value = p.split('/').pop();
    return labels.tool_id.has(value) ? value : null;
  }
  function toolStart(value) {
    if (!granted || !labels.tool_id.has(value)) return;
    if (!tools.has(value)) { tools.set(value, { timer: 0 }); emit('tool_start', { tool_id: value }); }
  }
  function toolAttempt(value) {
    toolStart(value);
    const state = tools.get(value);
    if (!state) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => emit('tool_no_response', { tool_id: value, error_type: 'timeout', step: 'result' }), 20000);
  }
  function toolResult(value, ok, errorType = 'calculation') {
    if (!granted || !tools.has(value)) return;
    clearTimeout(tools.get(value).timer);
    once(ok ? 'tool_result' : 'tool_error', { tool_id: value, error_type: ok ? undefined : errorType });
  }
  function abandon() {
    for (const [formId, state] of forms) {
      if (state.started && !state.received) emit('form_abandon', { form_id: formId, step: state.pending ? 'request' : 'input' }, state.path);
      clearTimeout(state.timer);
    }
    forms.clear();
    for (const state of tools.values()) clearTimeout(state.timer);
    tools.clear();
  }
  function failure(kind) {
    if (clientErrors >= 5 || !granted) return;
    clientErrors++;
    emit('client_error', { error_type: kind });
  }
  // De publieke interface voert geen data af zolang toestemming ontbreekt.
  window.siteMeting = { event: (name, params) => emit(name, params), once, formSubmit, formResult, toolStart, toolAttempt, toolResult, enabled: () => granted, settings: () => { if (panel) { panel.hidden = false; panel.querySelector('button').focus(); } } };
  document.addEventListener('input', e => {
    if (!(e.target instanceof Element)) return;
    const form = e.target.closest('form[data-meting-form]');
    if (form) formStart(form.dataset.metingForm);
    const value = toolId();
    if (value && e.target.matches('input,select,textarea')) {
      toolStart(value);
      if (value !== 'fo-planner') toolAttempt(value);
    }
  }, true);
  document.addEventListener('invalid', e => {
    const field = e.target;
    const form = field instanceof Element ? field.closest('form[data-meting-form]') : null;
    if (!form) return;
    const groups = { name: 'naam', naam: 'naam', email: 'email', tel: 'telefoon', subject: 'onderwerp', message: 'bericht', consent: 'toestemming' };
    once('form_invalid', { form_id: form.dataset.metingForm, field_group: groups[field.getAttribute('name')] || 'overig', error_type: 'validation' });
  }, true);
  document.addEventListener('submit', e => {
    const form = e.target;
    if (form instanceof HTMLFormElement && form.dataset.metingForm) formSubmit(form.dataset.metingForm);
  }, true);
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target.closest('[data-meting-event],a') : null;
    if (!target) return;
    if (target.dataset.metingEvent) once(target.dataset.metingEvent, { reading_mode: target.dataset.metingMode });
    if (target instanceof HTMLAnchorElement) {
      if (target.protocol === 'mailto:') once('contact_email_click');
      else if (document.querySelector('[data-meting-article]') && target.origin === location.origin && target.pathname !== location.pathname && target.closest('[data-meting-next]')) once('next_article_click');
    }
  }, true);
  document.addEventListener('play', e => { if (e.target instanceof HTMLVideoElement) once('video_start'); }, true);
  document.addEventListener('ended', e => { if (e.target instanceof HTMLVideoElement) once('video_complete'); }, true);
  window.addEventListener('error', e => {
    if (e.target instanceof HTMLVideoElement || e.target instanceof HTMLSourceElement) once('video_error', { error_type: 'media' });
    else failure(e instanceof ErrorEvent ? 'script' : 'resource');
  }, true);
  window.addEventListener('unhandledrejection', () => failure('promise'));
  window.addEventListener('pagehide', abandon);
  document.addEventListener('astro:page-load', page);
  window.addEventListener('popstate', page);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) { const result = original.apply(this, args); setTimeout(page, 0); return result; };
  }
  setInterval(() => {
    if (!granted || document.visibilityState !== 'visible' || !document.hasFocus()) return;
    page();
    const article = document.querySelector('[data-meting-article]');
    if (!article || engaged) return;
    const rect = article.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;
    activeSeconds++;
    const fraction = Math.min(1, Math.max(0, (innerHeight - rect.top) / Math.max(1, rect.height)));
    if (activeSeconds >= 30 && fraction >= 0.75) { engaged = true; once('article_engaged'); }
  }, 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui, { once: true }); else ui();
})();
