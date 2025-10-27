// Main application initialization
(function(){
  'use strict';
  
  // Simple Documentation Router
  var $body = document.body;
  
  // Update footer years
  var $footerYears = document.querySelectorAll('.footer-year');
  var $year = document.getElementById('year');
  if ($year) $year.textContent = new Date().getFullYear();

  // Navigation function
  function navigate() {
    var hash = window.location.hash.slice(1) || '/';
    
    // Handle root path - redirect to hub
    if (hash === '/' || hash === '') {
      window.location.href = 'index.html';
      return;
    }
    
    // Handle plugin documentation routes
    var pluginMatch = hash.match(/^plugins\/([^/]+)(?:\/docs(?:\/(.*))?)?/);
    
    if (pluginMatch) {
      var pluginId = pluginMatch[1];
      var pagePath = pluginMatch[2] || 'overview';
      loadPage('content/plugins/' + pluginId + '/docs/' + pagePath);
    } 
    // Handle legacy /docs/ paths
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
    return path.endsWith('index.html') || path === '/' || path === '';
  }

  // Initialize the hub page
  function initializeHub() {
    console.log('Initializing hub page...');
    
    // Show loading message
    var pluginGrid = document.getElementById('plugin-grid');
    if (pluginGrid) {
      pluginGrid.innerHTML = '<div class="loading">Loading plugins...</div>';
    }
    
    // Load plugins list
    fetch('plugins.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load plugins.json');
        return response.json();
      })
      .then(function(plugins) {
        console.log('Loaded plugins:', plugins);
        renderPlugins(plugins);
      })
      .catch(function(error) {
        console.error('Error loading plugins:', error);
        if (pluginGrid) {
          pluginGrid.innerHTML = [
            '<div class="warn">',
            '  <h3>Failed to load plugins</h3>',
            '  <p>' + (error.message || 'Unknown error') + '</p>',
            '  <p>Please check the console for more details.</p>',
            '</div>'
          ].join('\n');
        }
      });
  }
  
  // Render plugins in the grid
  function renderPlugins(plugins) {
    var pluginGrid = document.getElementById('plugin-grid');
    if (!pluginGrid) return;
    
    // Clear loading message
    pluginGrid.innerHTML = '';
    
    // Add each plugin to the grid
    plugins.forEach(function(plugin) {
      var pluginCard = document.createElement('div');
      pluginCard.className = 'plugin-card';
      pluginCard.innerHTML = [
        '<h3>' + (plugin.name || 'Unnamed Plugin') + '</h3>',
        '<p>' + (plugin.description || 'No description available.') + '</p>',
        '<a href="#/plugins/' + (plugin.id || '') + '/docs/overview" class="button">View Documentation</a>'
      ].join('\n');
      
      pluginGrid.appendChild(pluginCard);
    });
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
