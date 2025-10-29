// Main application initialization
(function(){
  'use strict';
  
  // Simple Documentation Router
  var $body = document.body;
  var debug = true;
  
  // Update footer years
  var $footerYears = document.querySelectorAll('.footer-year');
  var $year = document.getElementById('year');
  if ($year) $year.textContent = new Date().getFullYear();
  
  // Debug logging
  function log() {
    if (debug && console && console.log) {
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }

  // Built-in fallback plugins list (used if plugins.json fails to load)
  var DEFAULT_PLUGINS = [
    {
      id: 'cin',
      name: 'CIN Plugin',
      description: 'Professional Utility AI framework for Unreal Engine 5.5+. Build intelligent game AI in 15 minutes with 98 comprehensive pages, 800+ code examples, and production-ready archetypes. Features squad coordination, perception systems, task momentum, and Blueprint-first workflows.',
      version: '1.0.0',
      author: 'Code Furnace',
      repository: 'https://github.com/Letnn822/CIN-Plugin'
    }
  ];

  // Navigation function
  function navigate() {
    try {
      var hash = window.location.hash.slice(1) || '/';
      
      // Handle root path - redirect to hub
      if (hash === '/' || hash === '') {
        window.location.href = 'index.html';
        return;
      }
      
      // Handle plugin documentation routes: #/plugins/{id}/docs/{page}
      var pluginMatch = hash.match(/^\/plugins\/([^/]+)\/docs\/(.+)$/);
      
      if (pluginMatch) {
        var pluginId = pluginMatch[1];
        var pagePath = pluginMatch[2];
        
        // For CIN plugin, map to existing content/docs/ location
        if (pluginId === 'cin') {
          loadPage('content/docs/' + pagePath);
        } else {
          // For other plugins, use plugin-specific path
          loadPage('content/plugins/' + pluginId + '/docs/' + pagePath);
        }
      } 
      // Handle plugin overview: #/plugins/{id}/docs or #/plugins/{id}
      else if (hash.match(/^\/plugins\/([^/]+)(?:\/docs)?$/)) {
        var match = hash.match(/^\/plugins\/([^/]+)/);
        var pluginId = match[1];
        
        // Redirect to overview page
        if (pluginId === 'cin') {
          loadPage('content/docs/overview');
        } else {
          loadPage('content/plugins/' + pluginId + '/docs/overview');
        }
      }
      // Handle legacy /docs/ paths
      else if (hash.indexOf('/docs/') === 0) {
        loadPage('content/docs/' + hash.replace('/docs/', ''));
      }
      else if (hash.indexOf('docs/') === 0) {
        loadPage('content/docs/' + hash.replace('docs/', ''));
      }
      // Handle direct content paths
      else if (hash.indexOf('content/') === 0) {
        loadPage(hash);
      }
      // Try to load as a direct path under content/docs/
      else {
        loadPage('content/docs/' + hash);
      }
    } catch (error) {
      console.error('Error in navigate():', error);
    }
  }

  function loadPage(path) {
    // Remove any existing error messages
    var existingError = document.querySelector('.warn');
    if (existingError && existingError.parentNode) {
      existingError.parentNode.removeChild(existingError);
    }
    
    // Show loading state
    var mainContent = document.querySelector('main') || document.body;
    mainContent.innerHTML = '<div class="loading">Loading documentation...</div>';
    
    // Normalize path - remove leading/trailing slashes and .html
    var normalizedPath = path.replace(/^\/+|\/+$|\.html$/g, '');
    
    // Handle root path
    if (normalizedPath === 'content/docs' || normalizedPath === 'content/docs/') {
      normalizedPath = 'content/docs/overview';
    }
    
    console.log('Loading page:', normalizedPath);
    
    // Load the content
    fetch(normalizedPath + '.html')
      .then(function(response) {
        if (!response.ok) throw new Error('Page not found');
        return response.text();
      })
      .then(function(html) {
        mainContent.innerHTML = html;
        initializeCodeTabs();
        
        // Update active nav item if nav exists
        var navLinks = document.querySelectorAll('nav a');
        Array.prototype.forEach.call(navLinks, function(link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + path);
        });
        
        // Scroll to anchor if present
        var hash = window.location.hash;
        if (hash) {
          var anchor = document.getElementById(hash.substring(1));
          if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .catch(function(error) {
        console.error('Failed to load page:', error);
        mainContent.innerHTML = [
          '<div class="warn">',
          '  <h2>Page Not Found</h2>',
          '  <p>The requested page could not be found at: <code>' + normalizedPath + '</code></p>',
          '  <p><a href="index.html" class="button">Return to Documentation Hub</a></p>',
          '  <div class="debug-info">',
          '    <p><strong>Error:</strong> ' + (error.message || 'Unknown error') + '</p>',
          '    <p><strong>URL:</strong> ' + window.location.href + '</p>',
          '  </div>',
          '</div>'
        ].join('\n');
      });
  }

  // Initialize code tabs for the current page
  function initializeCodeTabs() {
    var tabContainers = document.querySelectorAll('.code-tabs');
    
    Array.prototype.forEach.call(tabContainers, function(container) {
      var tabs = container.querySelectorAll('.code-tab');
      var contents = container.querySelectorAll('.code-content');
      
      // Show first tab by default if none active
      var hasActive = false;
      Array.prototype.forEach.call(tabs, function(tab) {
        if (tab.classList.contains('active')) hasActive = true;
      });
      
      if (!hasActive && tabs.length > 0 && contents.length > 0) {
        tabs[0].classList.add('active');
        contents[0].style.display = 'block';
      }
      
      // Add click handlers
      Array.prototype.forEach.call(tabs, function(tab, index) {
        tab.addEventListener('click', function() {
          // Update active tab
          Array.prototype.forEach.call(tabs, function(t) {
            t.classList.remove('active');
          });
          tab.classList.add('active');
          
          // Show corresponding content
          Array.prototype.forEach.call(contents, function(content, contentIndex) {
            content.style.display = contentIndex === index ? 'block' : 'none';
          });
        });
      });
    });
  }
  
  // Check if we're on the hub page
  function isHubPage() {
    var path = window.location.pathname;
    var filename = path.split('/').pop();
    console.log('isHubPage check - pathname:', path, 'filename:', filename);
    // Check if we're on index.html or root path (with or without trailing slash)
    return filename === 'index.html' || filename === '' || path.endsWith('/');
  }
  
  // Initialize the hub page
  function initializeHub() {
    console.log('=== initializeHub() called ===');
    console.log('Document ready state:', document.readyState);
    console.log('Current location:', window.location.href);
    
    // Show loading message
    var pluginGrid = document.getElementById('plugin-grid');
    console.log('Plugin grid element:', pluginGrid);
    
    if (pluginGrid) {
      console.log('Setting loading message...');
      pluginGrid.innerHTML = '<div class="loading hub-loading"><div class="hub-spinner"></div><p>Loading plugins...</p></div>';
    } else {
      console.error('plugin-grid element not found in the DOM');
      return; // Exit if the container doesn't exist
    }
    
    // Determine the base path for GitHub Pages
    var basePath = window.location.pathname.replace(/\/[^/]*$/, '');
    if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);
    
    // Build the full path to plugins.json (with cache-busting)
    var pluginsPath = (basePath ? basePath + '/plugins.json' : 'plugins.json') + '?v=' + Date.now();
    
    // Load plugins list
    console.log('Fetching plugins.json from:', pluginsPath);
    fetch(pluginsPath)
      .then(function(response) {
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', response.headers);
        if (!response.ok) {
          throw new Error('Failed to load plugins.json: ' + response.status + ' ' + response.statusText);
        }
        return response.json();
      })
      .then(function(data) {
        console.log('Loaded data:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        
        // Ensure we have an array
        var plugins = Array.isArray(data) ? data : [data];
        console.log('Plugins to render:', plugins);
        
        if (plugins.length === 0) {
          throw new Error('No plugins found in plugins.json');
        }
        
        renderPlugins(plugins);
      })
      .catch(function(error) {
        console.error('Error loading plugins:', error);
        console.error('Error stack:', error.stack);
        // Fallback: render built-in list so the hub remains usable
        console.warn('Falling back to DEFAULT_PLUGINS...');
        try {
          renderPlugins(DEFAULT_PLUGINS);
        } catch (e) {
          if (pluginGrid) {
            pluginGrid.innerHTML = [
              '<div style="padding: 40px; text-align: center; color: rgba(255,255,255,0.6);">',
              '  <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 16px;">Failed to load plugins</h3>',
              '  <p style="margin-bottom: 8px;">' + (error.message || 'Unknown error') + '</p>',
              '  <p style="font-size: 14px; opacity: 0.7;">Attempted to load from: ' + pluginsPath + '</p>',
              '  <p style="font-size: 13px; margin-top: 16px;">Check the browser console (F12) for more details.</p>',
              '</div>'
            ].join('\n');
          }
        }
      });
  }
  
  // Render plugins in the grid
  function renderPlugins(plugins) {
    console.log('=== renderPlugins() called ===');
    console.log('Plugins to render:', plugins);
    
    var pluginGrid = document.getElementById('plugin-grid');
    if (!pluginGrid) {
      console.error('plugin-grid element not found in renderPlugins');
      return;
    }
    
    console.log('Updating plugin count...');
    // Update stats in header
    var pluginCount = document.getElementById('plugin-count');
    if (pluginCount) {
      pluginCount.textContent = plugins.length;
    }
    
    // Calculate total pages (for CIN plugin, we know it has 98 pages)
    var totalPages = 0;
    plugins.forEach(function(plugin) {
      // For now, assume CIN has 98 pages, others will add later
      if (plugin.id === 'cin') {
        totalPages += 98;
      }
    });
    
    var pageCount = document.getElementById('page-count');
    if (pageCount) {
      pageCount.textContent = totalPages + '+';
    }
    
    console.log('Clearing loading message and rendering', plugins.length, 'plugin cards...');
    // Clear loading message
    pluginGrid.innerHTML = '';
    
    // Add each plugin to the grid
    plugins.forEach(function(plugin, index) {
      var pluginCard = document.createElement('div');
      pluginCard.className = 'plugin-card';
      pluginCard.style.animationDelay = (index * 0.1 + 0.1) + 's';
      
      pluginCard.innerHTML = [
        '<h3>' + (plugin.name || 'Unnamed Plugin') + '</h3>',
        '<p>' + (plugin.description || 'No description available.') + '</p>',
        '<a href="#/plugins/' + (plugin.id || '') + '/docs/overview" class="button">',
        '  <span>View Documentation</span>',
        '  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '    <line x1="5" y1="12" x2="19" y2="12"></line>',
        '    <polyline points="12 5 19 12 12 19"></polyline>',
        '  </svg>',
        '</a>'
      ].join('\n');
      
      pluginGrid.appendChild(pluginCard);
      console.log('Added plugin card:', plugin.id);
    });
    
    console.log('=== Plugin rendering complete! ===');
    console.log('Total cards rendered:', plugins.length);
    
    // Re-initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      console.log('Re-initializing Lucide icons...');
      setTimeout(function() {
        lucide.createIcons();
        console.log('Lucide icons initialized');
      }, 100);
    }
  }
  
  // Initialize the app based on the current page
  function initializeApp() {
    if (isHubPage()) {
      initializeHub();
    } else {
      // Initialize the SPA router for documentation pages
      window.addEventListener('hashchange', navigate);
      window.addEventListener('load', navigate);
      navigate();
    }
  }
  
  // Start the application when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();
