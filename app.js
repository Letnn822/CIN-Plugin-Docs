(function(){
  // Multi-Plugin Documentation Hub System
  const pluginsUrl = 'plugins.json';
  let pluginsData = null;
  let currentPlugin = null;
  let currentManifest = null;
  
  // DOM Elements
  const $body = document.body;
  const $pluginGrid = document.getElementById('plugin-grid');
  const $pluginTemplate = document.getElementById('plugin-template');
  const $year = document.getElementById('year');
  if ($year) $year.textContent = new Date().getFullYear();

  // Update footer years
  const $footerYears = document.querySelectorAll('.footer-year');
  $footerYears.forEach($el => $el.textContent = new Date().getFullYear());

  async function init(){
    // Load plugins data
    try{
      const res = await fetch(pluginsUrl, { cache: 'no-store' });
      pluginsData = await res.json();
    }catch(err){
      $body.innerHTML = `<div class="warn">Unable to load plugins.json. ${err.message}</div>`;
      return;
    }

    // Setup routing
    window.addEventListener('hashchange', navigate);
    window.addEventListener('load', navigate);

    // Initial navigation
    navigate();
  }

  async function loadPlugins() {
    try {
      const response = await fetch(pluginsUrl);
      pluginsData = await response.json();
      return pluginsData;
    } catch (error) {
      console.error('Failed to load plugins:', error);
      return null;
    }
  }

  function navigate() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      showHub();
    } else if (parts[0] === 'plugins' && parts[1]) {
      const pluginId = parts[1];
      const page = parts[3] || null;
      showPlugin(pluginId, page);
    } else {
      showHub();
    }
  }

  function showHub() {
    $body.className = 'hub-page';
    if ($pluginTemplate) {
      $pluginTemplate.style.display = 'none';
    }
    renderPluginGrid();
  }

  function renderPluginGrid() {
    if (!$pluginGrid || !pluginsData) return;
    
    const plugins = pluginsData.plugins || [];
    $pluginGrid.innerHTML = plugins.map(plugin => `
      <div class="plugin-card" data-plugin="${plugin.id}">
        <div class="plugin-header">
          <div class="plugin-logo" style="background-color: ${plugin.color || '#4F46E5'}">${plugin.logo || plugin.shortName}</div>
          <div class="plugin-info">
            <h3>${plugin.name}</h3>
            <p>${plugin.description}</p>
          </div>
        </div>
        <div class="plugin-actions">
          <a href="#/plugins/${plugin.id}" class="btn-primary">View Documentation</a>
        </div>
      </div>
    `).join('');
  }

  async function showPlugin(pluginId, page) {
    const plugin = pluginsData?.plugins?.find(p => p.id === pluginId);
    if (!plugin) return;
    
    currentPlugin = plugin;
    $body.className = 'plugin-page';
    
    if ($pluginTemplate) {
      $pluginTemplate.style.display = '';
    }
    
    // Load plugin manifest
    try {
      const response = await fetch(plugin.manifestPath);
      currentManifest = await response.json();
      setupPluginView(plugin, page);
    } catch (error) {
      console.error('Failed to load plugin manifest:', error);
    }
  }

  function setupPluginView(plugin, page) {
    // Update branding
    const $logo = document.getElementById('plugin-logo');
    const $title = document.getElementById('plugin-title');
    if ($logo) $logo.textContent = plugin.logo || plugin.shortName;
    if ($title) $title.textContent = plugin.name;
    
    // Setup navigation and load first page
    const firstPage = currentManifest.docs.pages[0];
    if (firstPage && !page) {
      window.location.hash = `#/plugins/${plugin.id}/docs/${firstPage.slug}`;
    }
    
    // Initialize code tabs after content loads
    setTimeout(initializeCodeTabs, 100);
  }

  // Code Tabs Functionality
  function initializeCodeTabs() {
    const containers = document.querySelectorAll('.code-tabs-container');
    
    containers.forEach(container => {
      const buttons = container.querySelectorAll('.code-tab-button');
      const contents = container.querySelectorAll('.code-tab-content');
      
      // Activate first tab by default (Blueprint)
      if (buttons.length > 0 && contents.length > 0) {
        buttons[0].classList.add('active');
        contents[0].classList.add('active');
      }
      
      // Add click handlers
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
          // Remove active class from all buttons and contents
          buttons.forEach(btn => btn.classList.remove('active'));
          contents.forEach(content => content.classList.remove('active'));
          
          // Add active class to clicked button and corresponding content
          button.classList.add('active');
          if (contents[index]) {
            contents[index].classList.add('active');
          }
        });
      });
    });
  }

  // Also initialize code tabs on hash change (page navigation)
  window.addEventListener('hashchange', () => {
    setTimeout(initializeCodeTabs, 100);
  });

  init();
})();
