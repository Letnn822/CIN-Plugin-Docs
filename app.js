(function(){
  // Simple Documentation Router
  const $body = document.body;
  
  // Update footer years
  const $footerYears = document.querySelectorAll('.footer-year');
  // Set current year in the footer
  const $year = document.getElementById('year');
  if ($year) $year.textContent = new Date().getFullYear();

  // Initialize the app
  function init() {
    window.addEventListener('hashchange', navigate);
    window.addEventListener('load', navigate);
    navigate();
  }
  
  function navigate() {
    let hash = window.location.hash.slice(1) || '/';
    
    // Handle root path - redirect to docs home
    if (hash === '/' || hash === '') {
      hash = 'docs';
      window.location.hash = `#${hash}`;
      return;
    }
    
    // Handle docs path
    if (hash.startsWith('docs') || hash.startsWith('/docs')) {
      // Remove any leading slashes for consistency
      let docPath = hash.replace(/^\/+/, '');
      
      // If it's just 'docs', load the docs home
      if (docPath === 'docs') {
        docPath = 'docs/index';
      }
      
      loadPage(docPath);
    } else if (hash.startsWith('#')) {
      // Handle anchor links
      const anchor = document.getElementById(hash.substring(1));
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function loadPage(path) {
    // Remove any existing error messages
    const existingError = document.querySelector('.warn');
    if (existingError) existingError.remove();
    
    // Show loading state
    const mainContent = document.querySelector('main') || document.body;
    mainContent.innerHTML = '<div class="loading">Loading documentation...</div>';
    
    // Normalize path - ensure it doesn't have leading/trailing slashes or .html
    let normalizedPath = path.replace(/^\/+|\/+$|\.html$/g, '');
    
    // Build the correct file path
    const filePath = `content/${normalizedPath}.html`;
    
    // Load the content
    fetch(filePath, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Page not found');
        return response.text();
      })
      .then(html => {
        mainContent.innerHTML = html;
        initializeCodeTabs();
        // Update active nav item if nav exists
        document.querySelectorAll('nav a').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${path}`);
        });
        
        // Scroll to anchor if present
        const hash = window.location.hash;
        if (hash) {
          const anchor = document.getElementById(hash.substring(1));
          if (anchor) anchor.scrollIntoView();
        }
      })
      .catch(error => {
        console.error('Failed to load page:', error);
        console.log('Attempted to load:', path);
        mainContent.innerHTML = `
          <div class="warn">
            <h2>Page Not Found</h2>
            <p>The requested page could not be found at: <code>${path}</code></p>
            <p><a href="#docs">Return to documentation home</a></p>
            <p>If you believe this is an error, please check the URL or <a href="#docs/contributing">report an issue</a>.</p>
            <div style="margin-top: 20px; padding: 10px; background: #f8f8f8; border: 1px solid #ddd;">
              <strong>Debug Info:</strong><br>
              Path: ${path}<br>
              Attempted to load: ${filePath}
            </div>
          </div>
        `;
      });
  }

  // Initialize code tabs for the current page
  function initializeCodeTabs() {
    const tabContainers = document.querySelectorAll('.code-tabs');
    
    tabContainers.forEach(container => {
      const tabs = container.querySelectorAll('.code-tab');
      const contents = container.querySelectorAll('.code-content');
      
      // Show first tab by default if none active
      const hasActive = Array.from(tabs).some(tab => tab.classList.contains('active'));
      if (!hasActive && tabs.length > 0 && contents.length > 0) {
        tabs[0].classList.add('active');
        contents[0].style.display = 'block';
      }
      
      // Add click handlers
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Show corresponding content
          contents.forEach((content, contentIndex) => {
            content.style.display = contentIndex === index ? 'block' : 'none';
          });
        });
      });
    });
  }

  // Initialize the app
  init();
})();
