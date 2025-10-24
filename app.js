(function(){
  const manifestUrl = 'manifest.json';
  const $content = document.getElementById('content');
  const $contentBody = document.getElementById('content-body') || $content;
  const $breadcrumbs = document.getElementById('breadcrumbs');
  const $sidebar = document.getElementById('sidebar-nav');
  const $filter = document.getElementById('filter');
  const $year = document.getElementById('year');
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

  let manifest = null;
  let currentSection = 'docs';
  let currentSlug = 'overview';

  const routeFromHash = () => {
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/');
    const section = parts[0] || 'docs';
    const slug = parts[1] || defaultSlug(section);
    return { section, slug };
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
      document.title = `${page.title} — CIN Plugin Docs`;
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

  function navigate(section, slug){
    currentSection = section;
    currentSlug = slug;
    setActiveTab(section);
    buildSidebar(section);
    loadContent(section, slug);
  }

  function onHashChange(){
    const {section, slug} = routeFromHash();
    navigate(section, slug);
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
        location.hash = `#/${section}/${slug}`;
      });
    });

    // Filter
    if ($filter){
      $filter.addEventListener('input', ()=>buildSidebar(currentSection));
    }

    // Load manifest
    try{
      const res = await fetch(manifestUrl, { cache: 'no-store' });
      manifest = await res.json();
    }catch(err){
      $content.innerHTML = `<div class="warn">Unable to load manifest.json. ${err.message}</div>`;
      return;
    }

    window.addEventListener('hashchange', onHashChange);
    const {section, slug} = routeFromHash();
    navigate(section, slug);
  }

  init();
  // Start parallax after initial render
  initParallax();
})();
