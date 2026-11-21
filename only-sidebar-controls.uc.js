// ==UserScript==
// @name           Only Sidebar Controls
// @description    Floating controls for Zen's compact sidebar layout
// @author         levox00
// @version        1.0.1
// ==/UserScript==
// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
(() => {
  let cleanupInstance = null;
  let pending = null;
  let disposed = false;
  function start() {
    if (disposed) return;

  if (window.location.href !== 'chrome://browser/content/browser.xhtml' || window.__visibleControls || document.getElementById('visible-controls-overlay')) return;
  const doc = window.document;
  const root = doc.documentElement;
  const toolbox = doc.getElementById('navigator-toolbox');
  if (!toolbox || !window.gBrowser || !window.gZenCompactModeManager) return;
  window.__visibleControls = true;
  const bar = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
  bar.id = 'visible-controls-overlay';
  bar.style.display = 'none'; // The Zen Mod stylesheet explicitly enables the overlay.
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Schwebende Browsersteuerung');
  const actions = [
    ['back', 'Zurück', '←', () => window.gBrowser.goBack()],
    ['forward', 'Vorwärts', '→', () => window.gBrowser.goForward()],
    ['reload', 'Seite neu laden', '⟳', () => window.gBrowser.reload()],
    ['extensions', 'Erweiterungen', '🧩', async (event, button) => { bar.setAttribute('data-panel-opening', ''); try { await window.gUnifiedExtensions.togglePanel(event, undefined, undefined, undefined, button); } catch (error) { bar.removeAttribute('data-panel-opening'); update(); console.error('[Visible Controls]', error); } }],
  ];
  const buttons = {};
  for (const [id, label, icon, action] of actions) {
    const button = doc.createElementNS('http://www.w3.org/1999/xhtml', 'button');
    button.type = 'button'; button.id = `visible-controls-${id}`;
    button.setAttribute('aria-label', label); button.title = label; button.textContent = icon;
    button.addEventListener('click', event => { try { action(event, button); } catch (error) { console.error('[Visible Controls]', error); } });
    bar.appendChild(button); buttons[id] = button;
  }
  root.appendChild(bar);
  // Follow the page viewport itself, rather than guessing the toolbar height.
  const pageArea = doc.getElementById('tabbrowser-tabpanels');
  let trackingFrame = 0;
  let trackingUntil = 0;
  // Keep controls on the page, also when compact toolbars float over it.
  function calculateBounds(page, sidebar, topbar, sidebarOpen, topbarOpen, sidebarRight) {
    let left = page.left, right = page.right, top = page.top;
    if (sidebarOpen && sidebar && sidebar.width > 0 && sidebar.height > 0 && sidebar.bottom > page.top && sidebar.top < page.bottom) {
      if (sidebarRight && sidebar.left < right && sidebar.right > left) right = Math.max(left, Math.min(right, sidebar.left));
      if (!sidebarRight && sidebar.right > left && sidebar.left < right) left = Math.min(right, Math.max(left, sidebar.right));
    }
    if (topbarOpen && topbar && topbar.height > 0 && topbar.width > 0 && topbar.right > left && topbar.left < right && topbar.top <= top + 2) {
      top = Math.min(page.bottom, Math.max(top, topbar.bottom));
    }
    return {left, right, top};
  }
  const isSidebarOpen = () => ['zen-has-hover','zen-user-show','zen-has-empty-tab','flash-popup','has-popup-menu','movingtab','zen-compact-mode-active'].some(a => toolbox.hasAttribute(a));
  const isTopbarOpen = () => !!navWrapper && ['zen-has-hover','has-popup-menu','zen-compact-mode-active'].some(a => navWrapper.hasAttribute(a));
  const position = () => {
    if (!pageArea) return;
    const rect = pageArea.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const box = calculateBounds(rect, toolbox.getBoundingClientRect(), navWrapper?.getBoundingClientRect(), isSidebarOpen(), isTopbarOpen(), root.getAttribute('zen-right-side') === 'true');
    bar.style.setProperty('--vc-page-top', `${Math.max(0, box.top)}px`);
    bar.style.setProperty('--vc-page-left', `${Math.max(0, box.left)}px`);
    bar.style.setProperty('--vc-page-right', `${Math.max(0, window.innerWidth - box.right)}px`);
  };
  const trackTransition = () => {
    trackingUntil = window.performance.now() + 800;
    if (trackingFrame) return;
    const tick = () => {
      position();
      if (window.performance.now() < trackingUntil) trackingFrame = window.requestAnimationFrame(tick);
      else trackingFrame = 0;
    };
    trackingFrame = window.requestAnimationFrame(tick);
  };
  const sizeObserver = new window.ResizeObserver(trackTransition);
  if (pageArea) sizeObserver.observe(pageArea);
  sizeObserver.observe(toolbox);
  const navWrapper = doc.getElementById('zen-appcontent-navbar-wrapper');
  if (navWrapper) sizeObserver.observe(navWrapper);
  window.addEventListener('resize', trackTransition);
  doc.addEventListener('transitionrun', trackTransition, true);
  doc.addEventListener('transitionend', position, true);
  const update = () => {
    trackTransition();
    const show = !root.hasAttribute('customizing') && root.getAttribute('inDOMFullscreen') !== 'true';
    bar.toggleAttribute('data-visible', show);
    buttons.back.disabled = !window.gBrowser.canGoBack;
    buttons.forward.disabled = !window.gBrowser.canGoForward;
  };
  const onPopupHidden = event => { if (event.target.id === 'unified-extensions-panel') { bar.removeAttribute('data-panel-opening'); update(); } };
  doc.addEventListener('popuphidden', onPopupHidden);
  const observer = new MutationObserver(update);
  observer.observe(root, {attributes: true, attributeFilter: ['zen-compact-mode','inDOMFullscreen','customizing','zen-right-side']});
  observer.observe(toolbox, {attributes: true});
  if (navWrapper) observer.observe(navWrapper, {attributes: true});
  for (const name of ['TabSelect','SSTabRestored']) window.gBrowser.tabContainer.addEventListener(name, update);
  window.addEventListener('ZenCompactMode:LayoutUpdate', update);
  window.addEventListener('ZenCompactMode:Toggled', update);
  window.addEventListener('load', update, {once:true});
  const progress = {onLocationChange: update, onStateChange() {}, onProgressChange() {}, onStatusChange() {}, onSecurityChange() {}, onContentBlockingEvent() {}, QueryInterface: ChromeUtils.generateQI(['nsIWebProgressListener','nsISupportsWeakReference'])};
  window.gBrowser.addTabsProgressListener(progress);
  cleanupInstance = () => {
    observer.disconnect(); sizeObserver.disconnect();
    if (trackingFrame) window.cancelAnimationFrame(trackingFrame);
    window.removeEventListener('resize', trackTransition);
    doc.removeEventListener('transitionrun', trackTransition, true);
    doc.removeEventListener('transitionend', position, true);
    doc.removeEventListener('popuphidden', onPopupHidden);
    for (const name of ['TabSelect','SSTabRestored']) window.gBrowser.tabContainer.removeEventListener(name, update);
    window.removeEventListener('ZenCompactMode:LayoutUpdate', update);
    window.removeEventListener('ZenCompactMode:Toggled', update);
    window.removeEventListener('load', update);
    try { window.gBrowser.removeTabsProgressListener(progress); } catch (_) {}
    bar.remove(); delete window.__visibleControls;
  };
  update();

  }
  function cleanup() {
    disposed = true;
    if (pending) { Services.obs.removeObserver(pending, 'browser-delayed-startup-finished'); pending = null; }
    if (cleanupInstance) { cleanupInstance(); cleanupInstance = null; }
    window.removeEventListener('unload', cleanup);
  }
  // Sine may not initialise checkbox defaults until the settings dialog opens.
  // Default-branch values preserve all existing user choices.
  const defaults = Services.prefs.getDefaultBranch('');
  for (const name of ['mod.visible_controls.navigation', 'mod.visible_controls.extensions']) {
    if (Services.prefs.getPrefType(name) === 0) defaults.setBoolPref(name, true);
  }
  if (typeof window.addUnloadListener === 'function') window.addUnloadListener(cleanup);
  window.addEventListener('unload', cleanup, {once: true});
  if (window.gBrowserInit?.delayedStartupFinished) start();
  else {
    pending = function(subject) {
      if (subject !== window) return;
      Services.obs.removeObserver(pending, 'browser-delayed-startup-finished');
      pending = null;
      start();
    };
    Services.obs.addObserver(pending, 'browser-delayed-startup-finished');
  }
})();
