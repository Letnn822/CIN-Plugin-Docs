(function(){
  // Multi-plugin hub support
  const registryUrl = 'plugins.json';
  let registry = null;              // { plugins: [{ id, name, slug, manifest, ...}] }
  let manifest = null;              // current plugin manifest
  let currentPlugin = null;         // current plugin slug (e.g., 'cin' or 'gameplay-tags-manager')
  let currentSection = 'docs';
  let currentSlug = 'overview';

  const $content = document.getElementById('content');
  const $contentBody = document.getElementById('content-body') || $content;
  const $breadcrumbs = document.getElementById('breadcrumbs');
  const $sidebar = document.getElementById('sidebar-nav');
  const $filter = document.getElementById('filter');
  const $year = document.getElementById('year');
  const $brand = document.querySelector('.brand');
  const $logo = document.querySelector('.logo');
  const $titleH1 = document.querySelector('.titles h1');
  const $titleP = document.querySelector('.titles p');
  if ($year) $year.textContent = new Date().getFullYear();

  // Glossary tooltip system (beginner-friendly hover definitions)
  const glossary = {
    'Action Pack': { def: 'A data asset listing available actions (with animation and requirements) used by the Brain at runtime.', link: '#/docs/action-packs' },
    'Goal Template': { def: 'A data asset that defines when and how goals are created at runtime, including priority and completion rules.', link: '#/docs/goal-templates' },
    'Role Archetype': { def: 'A personality/profile data asset that sets defaults like goals and action pack for an agent type.', link: '#/docs/role-archetypes' },
    'Arbitration Strategy': { def: 'The method that combines opinions from intelligence layers into a single decision.', link: '#/docs/arbitration-strategy' },
    'Parameter Binding': { def: 'The system that connects game signals (like Health, Distance) to the AI using normalized values.', link: '#/docs/parameter-binding' },
    'Blueprint': { def: 'Unreal Engine’s visual scripting system for creating gameplay without C++.' },
    'Data Asset': { def: 'An Unreal object that stores structured, designer-editable data (UDataAsset based).' },
    'Gameplay Ability System': { def: 'Epic’s ability/attribute framework (GAS). CIN can bind parameters to GAS attributes.', link: '#/docs/gas-integration' },
    'Soft Class Reference': { def: 'A reference to a class that is loaded on demand (e.g., TSoftClassPtr).' },
    'UObject': { def: 'The base class for most Unreal Engine objects.' },
    'Actor': { def: 'An object that can be placed or spawned in a level.' }
  };

  let tooltipEl = null;

  function ensureTooltipEl() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'glossary-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function positionTooltip(evt) {
    if (!tooltipEl) return;
    const padding = 12;
    let x = evt.clientX + 12;
    let y = evt.clientY + 14;
    const vw = window.innerWidth, vh = window.innerHeight;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width + padding > vw) x = vw - rect.width - padding;
    if (y + rect.height + padding > vh) y = vh - rect.height - padding;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  }

  function showGlossaryTooltip(target, evt) {
    const tip = ensureTooltipEl();
    const term = target.getAttribute('data-term') || target.textContent.trim();
    const def = target.getAttribute('data-def') || '';
    const link = target.getAttribute('data-link') || '';
    tip.innerHTML = `<strong>${term}</strong><div style="margin-top:4px;color:var(--muted)">${def}${link?` <a href="${link}" style="color:var(--accent)">Learn more →</a>`:''}</div>`;
    tip.style.display = 'block';
    positionTooltip(evt);
  }

  function hideGlossaryTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function annotateGlossary(container) {
    if (!container) return;
    // Mark anchors that already point to a known doc
    container.querySelectorAll('a[href^="#/"]').forEach(a=>{
      const text = a.textContent.trim();
      const entry = glossary[text] || glossary[text.replace(/\s+/g,' ')];
      if (entry) {
        a.classList.add('glossary-term');
        a.setAttribute('data-term', text);
        a.setAttribute('data-def', entry.def);
        if (entry.link) a.setAttribute('data-link', entry.link);
      }
    });

    // Walk text nodes and wrap known terms (skip code/pre/a/script/style)
    const skip = new Set(['CODE','PRE','A','SCRIPT','STYLE']);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || skip.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const terms = Object.keys(glossary).sort((a,b)=>b.length-a.length);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (textNode.parentElement.closest('.glossary-term')) continue;
      let replaced = false;
      let frag = document.createDocumentFragment();
      let text = textNode.nodeValue;
      let index = 0;
      while (true) {
        let bestMatch = null;
        let bestPos = -1;
        const lower = text.toLowerCase();
        for (const term of terms) {
          const pos = lower.indexOf(term.toLowerCase(), index);
          if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
            bestPos = pos;
            bestMatch = term;
          }
        }
        if (bestPos === -1) break;
        // boundary check (avoid partial words)
        const before = bestPos === 0 ? ' ' : text[bestPos-1];
        const afterIdx = bestPos + bestMatch.length;
        const after = afterIdx >= text.length ? ' ' : text[afterIdx];
        const wordChar = c => /[A-Za-z0-9_]/.test(c);
        if (wordChar(before) || wordChar(after)) {
          index = bestPos + bestMatch.length;
          continue;
        }
        if (bestPos > index) frag.appendChild(document.createTextNode(text.slice(index, bestPos)));
        const span = document.createElement('span');
        const entry = glossary[bestMatch];
        span.className = 'glossary-term';
        span.textContent = text.substr(bestPos, bestMatch.length);
        span.setAttribute('data-term', bestMatch);
        if (entry) {
          span.setAttribute('data-def', entry.def);
          if (entry.link) span.setAttribute('data-link', entry.link);
        }
        frag.appendChild(span);
        index = bestPos + bestMatch.length;
        replaced = true;
      }
      if (replaced) {
        if (index < text.length) frag.appendChild(document.createTextNode(text.slice(index)));
        textNode.parentNode.replaceChild(frag, textNode);
      }
    }

    // Event delegation (once per content container)
    if (!container.__glossaryBound) {
      container.addEventListener('mouseover', (e)=>{
        const t = e.target.closest('.glossary-term');
        if (t) showGlossaryTooltip(t, e);
      });
      container.addEventListener('mousemove', (e)=>{
        if (e.target.closest && e.target.closest('.glossary-term')) positionTooltip(e);
      });
      container.addEventListener('mouseout', (e)=>{
        if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.glossary-term')) return;
        hideGlossaryTooltip();
      });
      container.addEventListener('click', (e)=>{
        const t = e.target.closest('.glossary-term');
        if (t) {
          const link = t.getAttribute('data-link');
          if (link && link.startsWith('#/')) {
            e.preventDefault();
            location.hash = link;
          }
        }
      });
      container.__glossaryBound = true;
    }
  }

  // ----- Helpers for hub/plugin modes -----
  function findPluginBySlug(slug){
    return registry?.plugins?.find(p=>p.slug===slug) || null;
  }

  function computeManifestUrlFor(slug){
    // For backward compatibility, CIN continues to use root manifest.json
    if (slug === 'cin' || !slug) return 'manifest.json';
    const entry = findPluginBySlug(slug);
    return entry?.manifest || `plugins/${slug}/manifest.json`;
  }

  function setBrandForHub(){
    if ($logo) $logo.textContent = 'CF';
    if ($titleH1) $titleH1.textContent = 'Code Furnace Plugins';
    if ($titleP) $titleP.textContent = 'Documentation Hub';
  }

  function setBrandForPlugin(slug){
    const entry = findPluginBySlug(slug);
    const name = entry?.name || (slug==='cin' ? 'CIN Plugin' : 'Plugin');
    const logoText = (slug==='cin') ? 'CIN' : (name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,3) || 'CF');
    if ($logo) $logo.textContent = logoText;
    if ($titleH1) $titleH1.textContent = name;
    if ($titleP) $titleP.textContent = 'Documentation & Guides';
  }

  function showSidebar(visible){
    const aside = document.querySelector('.sidebar');
    if (!aside) return;
    aside.style.display = visible ? '' : 'none';
  }

  // Routing: hub or plugin
  const routeFromHash = () => {
    const hash = location.hash.replace(/^#\/?/, '');
    if (!hash || hash === '' || hash === 'hub') {
      return { mode: 'hub' };
    }
    const parts = hash.split('/');
    if (parts[0] === 'plugins') {
      const plugin = parts[1] || 'cin';
      const section = parts[2] || 'docs';
      const slug = parts[3] || null; // compute later once manifest is loaded
      return { mode: 'plugin', plugin, section, slug };
    }
    // Legacy routes: #/docs/<page> → map to CIN plugin
    const section = parts[0] || 'docs';
    const slug = parts[1] || null;
    return { mode: 'plugin', plugin: 'cin', section, slug, legacy: true };
  };

  const defaultSlug = (section) => {
    const sec = manifest?.[section];
    return sec?.pages?.[0]?.slug || 'overview';
  };

  function setActiveTab(section){
    document.querySelectorAll('.nav-tab').forEach(btn=>{
      const active = btn.dataset.section === section;
      btn.classList.toggle('active', active);
    });
  }

  function buildSidebar(section){
    if (!manifest) return;
    const sec = manifest[section];
    if (!sec) return;
    const filterText = ($filter?.value || '').toLowerCase();

    let html = '';
    if (sec.groups) {
      for (const group of sec.groups){
        const pages = sec.pages.filter(p=>p.group===group);
        if (!pages.length) continue;
        html += `<div class="group">${group}</div>`;
        for (const p of pages){
          if (filterText && !(`${p.title} ${p.slug}`.toLowerCase().includes(filterText))) continue;
          const active = (p.slug === currentSlug);
          html += `<a class="link ${active?'active':''}" data-slug="${p.slug}" href="#/${section}/${p.slug}">${p.title}</a>`;
        }
      }
    } else {
      for (const p of sec.pages){
        if (filterText && !(`${p.title} ${p.slug}`.toLowerCase().includes(filterText))) continue;
        const active = (p.slug === currentSlug);
        html += `<a class="link ${active?'active':''}" data-slug="${p.slug}" href="#/${section}/${p.slug}">${p.title}</a>`;
      }
    }
    $sidebar.innerHTML = html;
  }

  async function loadContent(section, slug){
    try{
      const sec = manifest[section];
      if (!sec) throw new Error('Unknown section');
      const page = sec.pages.find(p=>p.slug===slug) || sec.pages[0];
      if (!page) throw new Error('Page not found');
      const pluginEntry = findPluginBySlug(currentPlugin);
      const pluginName = pluginEntry?.name || (currentPlugin==='cin' ? 'CIN Plugin' : 'Plugin');
      document.title = `${page.title} — ${pluginName} Docs`;
      const res = await fetch(page.path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // Inject page HTML into content body (fallback to content for backward compatibility)
      if ($contentBody) { $contentBody.innerHTML = html; } else { $content.innerHTML = html; }

      // Render breadcrumbs if available
      if ($breadcrumbs) {
        const secTitle = manifest[section]?.title || (section === 'docs' ? 'Documentation' : 'Examples');
        const homeSlug = defaultSlug(section);
        const crumbs = [];
        crumbs.push(`<a href="#/${section}/${homeSlug}">${secTitle}</a>`);
        if (page.group) {
          crumbs.push(`<span class="crumb group">${page.group}</span>`);
        }
        crumbs.push(`<span class="crumb current">${page.title}</span>`);
        $breadcrumbs.innerHTML = crumbs.join('<span class="sep">/</span>');
      }

      // Glossary annotate only the rendered body
      annotateGlossary($contentBody || $content);
      ($content || document.body).focus({ preventScroll: true });
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    }catch(err){
      $content.innerHTML = `<div class="warn"><strong>Failed to load content.</strong><br/>${err.message}</div>`;
    }
  }

  function renderHub(){
    setBrandForHub();
    showSidebar(false);
    const plugins = registry?.plugins || [{ id: 'cin', slug: 'cin', name: 'CIN AI', category: 'AI Systems', description: 'Utility AI framework for Unreal Engine', manifest: 'manifest.json', icon: 'bot' }];
    const cards = plugins.map(p=>{
      const overviewHash = `#/plugins/${p.slug}/docs/overview`;
      return `
        <div class="journey-card">
          <h4>${p.name}</h4>
          <p>${p.description || ''}</p>
          <ul>
            <li>Category: ${p.category || ''}</li>
            <li>Open: <a href="${overviewHash}">${overviewHash}</a></li>
          </ul>
          <div class="hero-cta"><a class="button primary" href="${overviewHash}">Open Docs</a></div>
        </div>`;
    }).join('');
    const html = `
      <section class="hero-modern">
        <div class="hero-bg-modern"></div>
        <div class="hero-content-modern">
          <div class="hero-badge-row"><span class="badge-new">Documentation Hub</span></div>
          <h1 class="hero-title-modern">Choose a Plugin</h1>
          <p class="hero-subtitle-modern">Browse Code Furnace documentation collections.</p>
        </div>
      </section>
      <div class="journey-cards">${cards}</div>`;
    if ($contentBody) { $contentBody.innerHTML = html; } else { $content.innerHTML = html; }
    document.title = 'Code Furnace — Documentation Hub';
  }

  async function loadManifestForPlugin(pluginSlug){
    const url = computeManifestUrlFor(pluginSlug);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Unable to load ${url} (HTTP ${res.status})`);
    manifest = await res.json();
  }

  async function navigateRoute(state){
    if (state.mode === 'hub'){
      renderHub();
      return;
    }
    // Plugin mode
    currentPlugin = state.plugin || 'cin';
    setBrandForPlugin(currentPlugin);
    showSidebar(true);
    try{
      await loadManifestForPlugin(currentPlugin);
    }catch(err){
      $content.innerHTML = `<div class="warn">${err.message}</div>`;
      return;
    }
    currentSection = state.section || 'docs';
    const slug = state.slug || defaultSlug(currentSection);
    currentSlug = slug;
    // If legacy route, rewrite to canonical URL
    if (state.legacy){
      location.hash = `#/plugins/${currentPlugin}/${currentSection}/${currentSlug}`;
      return;
    }
    setActiveTab(currentSection);
    buildSidebar(currentSection);
    loadContent(currentSection, currentSlug);
  }

  function onHashChange(){
    const state = routeFromHash();
    navigateRoute(state);
  }

  // Optional parallax background (pointer-based), respects reduced motion
  function initParallax(){
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disable = () => {
      root.style.setProperty('--nebula-x','0px');
      root.style.setProperty('--nebula-y','0px');
      root.style.setProperty('--grid-x','0px');
      root.style.setProperty('--grid-y','0px');
    };
    if (mql.matches) { disable(); return; }

    let vw = window.innerWidth, vh = window.innerHeight;
    let tx = 0, ty = 0;     // target normalized [-1,1]
    let x = 0, y = 0;       // current normalized
    const cssStrength = parseFloat(getComputedStyle(root).getPropertyValue('--parallax-strength')) || 1;
    const nebulaAmp = 14 * cssStrength;
    const gridAmp = 8 * cssStrength;

    const onPointer = (e) => {
      // center-based normalization
      const nx = (e.clientX / vw) * 2 - 1;
      const ny = (e.clientY / vh) * 2 - 1;
      tx = Math.max(-1, Math.min(1, nx));
      ty = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', ()=>{ vw = innerWidth; vh = innerHeight; }, { passive: true });

    const lerp = (a,b,t)=>a+(b-a)*t;
    const step = () => {
      x = lerp(x, tx, 0.06);
      y = lerp(y, ty, 0.06);
      // Opposing directions for parallax depth
      root.style.setProperty('--nebula-x', `${(-x*nebulaAmp).toFixed(2)}px`);
      root.style.setProperty('--nebula-y', `${(-y*nebulaAmp).toFixed(2)}px`);
      root.style.setProperty('--grid-x', `${(x*gridAmp).toFixed(2)}px`);
      root.style.setProperty('--grid-y', `${(y*gridAmp).toFixed(2)}px`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    // If preference changes at runtime
    mql.addEventListener('change', ev => { if (ev.matches) disable(); });
  }

  async function init(){
    // Tabs
    document.querySelectorAll('.nav-tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const section = btn.dataset.section;
        const slug = defaultSlug(section);
        if (currentPlugin){
          location.hash = `#/plugins/${currentPlugin}/${section}/${slug}`;
        } else {
          // If on hub, default to CIN
          location.hash = `#/plugins/cin/${section}/${slug}`;
        }
      });
    });

    // Filter
    if ($filter){
      $filter.addEventListener('input', ()=>buildSidebar(currentSection));
    }

    // Brand click returns to hub
    if ($brand){
      $brand.addEventListener('click', ()=>{ location.hash = '#/'; });
    }

    // Load registry (optional for single-plugin backward compatibility)
    try{
      const res = await fetch(registryUrl, { cache: 'no-store' });
      if (res.ok){ registry = await res.json(); }
    }catch(e){ /* ignore; fallback to single-plugin */ }

    window.addEventListener('hashchange', onHashChange);
    const state = routeFromHash();
    await navigateRoute(state);
  }

  init();
  // Start parallax after initial render
  initParallax();
})();
