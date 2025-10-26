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
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    
    // Handle direct page loading
    if (hash.startsWith('/docs/') || hash === '/') {
      loadPage(hash);
    } else if (hash.startsWith('#')) {
      // Handle anchor links
      const anchor = document.getElementById(hash.substring(1));
      if (anchor) anchor.scrollIntoView();
    }
  }

  function loadPage(path) {
    // Remove any existing error messages
    const existingError = document.querySelector('.warn');
    if (existingError) existingError.remove();
    
    // Show loading state
    const mainContent = document.querySelector('main') || document.body;
    mainContent.innerHTML = '<div class="loading">Loading documentation...</div>';
    
    // Load the content
    fetch(`content${path}.html`, { cache: 'no-store' })
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
        mainContent.innerHTML = `
          <div class="warn">
            <h2>Page Not Found</h2>
            <p>The requested page could not be loaded. <a href="#/">Return to documentation home</a></p>
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
