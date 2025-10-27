(function(){
    // Cache DOM elements
    const DOM = {
        body: document.body,
        mainContent: document.querySelector('main') || document.body,
        year: document.getElementById('year'),
        footerYears: document.querySelectorAll('.footer-year')
    };

    // Configuration
    const CONFIG = {
        defaultRoute: 'docs',
        contentPath: 'content',
        debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };

    /**
     * Initialize the application
     */
    function init() {
        // Set current year in footer
        if (DOM.year) {
            DOM.year.textContent = new Date().getFullYear();
        }

        // Initialize event listeners
        const handleNavigation = () => navigate();
        window.addEventListener('hashchange', handleNavigation);
        window.addEventListener('load', handleNavigation);

        // Initial navigation
        navigate();
    }

    /**
     * Handle navigation based on URL hash
     */
    function navigate() {
        const hash = window.location.hash.slice(1) || CONFIG.defaultRoute;
        const normalizedHash = normalizePath(hash);

        // Handle root path - redirect to default route
        if (!normalizedHash || normalizedHash === '/') {
            updateHash(CONFIG.defaultRoute);
            return;
        }

        // Handle anchor links
        if (hash.startsWith('#')) {
            const anchorId = hash.substring(1);
            const anchor = document.getElementById(anchorId);
            if (anchor) {
                smoothScroll(anchor);
                return;
            }
        }

        // Handle documentation pages
        if (normalizedHash === 'docs') {
            loadPage('docs/index');
        } else if (normalizedHash.startsWith('docs/')) {
            loadPage(normalizedHash);
        } else {
            // Try to load as a direct path under docs/
            loadPage(`docs/${normalizedHash}`);
        }
    }

    /**
     * Load a page from the server
     * @param {string} path - The path to load (without .html extension)
     */
    function loadPage(path) {
        showLoadingState();

        const normalizedPath = normalizePath(path);
        // Ensure we don't have double slashes in the path
        const cleanPath = normalizedPath.replace(/\/+/g, '/');
        const filePath = `${CONFIG.contentPath}/${cleanPath}.html`; 
        
        if (CONFIG.debug) {
            console.log('Loading page:', { path, normalizedPath, cleanPath, filePath });
        }

        fetch(filePath, { cache: 'no-store' })
            .then(handleResponse)
            .then(html => {
                updateContent(html);
                initializeCodeTabs();
                updateActiveNav(normalizedPath);
                scrollToAnchor();
            })
            .catch(error => {
                console.error('Failed to load page:', error);
                showErrorPage(normalizedPath, filePath, error);
            });
    }

    /**
     * Normalize a path by removing leading/trailing slashes and .html extension
     */
    function normalizePath(path) {
        return path.replace(/^\/+|\/+$|\.html$/g, '');
    }

    /**
     * Update the browser's URL hash
     */
    function updateHash(path) {
        if (window.location.hash !== `#${path}`) {
            window.location.hash = path;
        }
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        removeExistingErrors();
        DOM.mainContent.innerHTML = '<div class="loading">Loading documentation...</div>';
    }

    /**
     * Remove any existing error messages
     */
    function removeExistingErrors() {
        const existingError = document.querySelector('.warn');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Handle fetch response
     */
    function handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    }

    /**
     * Update the main content area with new HTML
     */
    function updateContent(html) {
        // Use a document fragment for better performance
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('div');
        temp.innerHTML = html;

        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }

        DOM.mainContent.innerHTML = '';
        DOM.mainContent.appendChild(fragment);
    }

    /**
     * Update the active navigation item
     */
    function updateActiveNav(currentPath) {
        document.querySelectorAll('nav a').forEach(link => {
            const linkPath = normalizePath(link.getAttribute('href').replace(/^#/, ''));
            const isActive = linkPath === currentPath ||
                (currentPath.startsWith(linkPath) && linkPath !== '');
            link.classList.toggle('active', isActive);
        });
    }

    /**
     * Scroll to an anchor if present in the URL
     */
    function scrollToAnchor() {
        const hash = window.location.hash;
        if (hash) {
            const anchor = document.getElementById(hash.substring(1));
            if (anchor) {
                smoothScroll(anchor);
            }
        }
    }

    /**
     * Smooth scroll to an element
     */
    function smoothScroll(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    /**
     * Show an error page
     */
    function showErrorPage(path, filePath, error) {
        DOM.mainContent.innerHTML = `
      <div class="warn">
        <h2>Page Not Found</h2>
        <p>The requested page could not be found at: <code>${path}</code></p>
        <p><a href="#${CONFIG.defaultRoute}" class="button">Return to documentation home</a></p>
        ${CONFIG.debug ? `
        <div class="debug-info">
          <h3>Debug Information</h3>
          <p><strong>Path:</strong> ${path}</p>
          <p><strong>File:</strong> ${filePath}</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </div>
        ` : ''}
      </div>
    `;
    }

    /**
     * Initialize code tabs for the current page
     */
    function initializeCodeTabs() {
        const tabContainers = document.querySelectorAll('.code-tabs');

        tabContainers.forEach(container => {
            const tabs = Array.from(container.querySelectorAll('.code-tab'));
            const contents = Array.from(container.querySelectorAll('.code-content'));

            // Show first tab by default if none active
            const hasActive = tabs.some(tab => tab.classList.contains('active'));
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

                    // Update URL hash if tab has a data-hash attribute
                    const tabHash = tab.getAttribute('data-hash');
                    if (tabHash) {
                        updateHash(tabHash);
                    }
                });
            });
        });
    }

    // Initialize the application when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API
    window.CIN_Docs = {
        navigate: (path) => {
            updateHash(path);
            return false;
        },
        refresh: () => {
            navigate();
        }
    };
})();