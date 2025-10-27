(function(){
    // Cache DOM elements
    const DOM = {
        body: document.body,
        mainContent: document.querySelector('main') || document.body,
        footerYears: document.querySelectorAll('.footer-year')
    };

    // Configuration
    const CONFIG = {
        defaultRoute: 'plugins/cin/docs',
        contentPath: '',  // Path is now relative to the HTML file
        debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };

    /**
     * Initialize the application
     */
    function init() {
{{ ... }}
                smoothScroll(anchor);
                return;
            }
        }

        // Handle plugin documentation routes
        const pluginMatch = normalizedHash.match(/^plugins\/([^\/]+)(\/docs(\/.*)?)?/);
        
        if (pluginMatch) {
            const [_, pluginId, , pagePath = ''] = pluginMatch;
            const cleanPath = pagePath.replace(/^\//, '');
            loadPage(`plugins/${pluginId}/docs/${cleanPath || 'index'}`);
        } 
        // Legacy docs path support
        else if (normalizedHash === 'docs' || normalizedHash.startsWith('docs/')) {
            // Redirect to the CIN plugin docs
            const docPath = normalizedHash.replace(/^docs\/?/, '');
            updateHash(`plugins/cin/docs/${docPath}`);
        } 
        // Default to CIN plugin docs
        else if (normalizedHash) {
            loadPage(`plugins/cin/docs/${normalizedHash}`);
        } 
        // Fallback to CIN plugin docs home
        else {
            updateHash('plugins/cin/docs');
        }
    }

    /**
     * Load a page from the server
     * @param {string} path - The path to load (without .html extension)
     */
    function loadPage(path) {
        showLoadingState();

        const normalizedPath = normalizePath(path);
        // Normalize path - remove duplicate slashes and trim leading/trailing slashes
        const cleanPath = normalizedPath.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
        // Remove any trailing 'index' from the path
        const finalPath = cleanPath.replace(/\/index$/, '');
        const filePath = `${finalPath || 'index'}.html`; 
        
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
                (currentPath.endsWith(linkPath) && 
                 (linkPath.length > 0 && currentPath.endsWith('/' + linkPath)));
            link.classList.toggle('active', isActive);
            
            if (CONFIG.debug && isActive) {
                console.log('Active nav item:', { linkPath, currentPath });
            }
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
                <p>We couldn't find the page you're looking for.</p>
                <p><a href="#${CONFIG.defaultRoute}" class="button">Return to Documentation Home</a></p>
                ${CONFIG.debug ? `
                <div class="debug-info">
                    <h3>Debug Information</h3>
                    <p><strong>Path:</strong> ${path}</p>
                    <p><strong>File:</strong> ${filePath}</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Current URL:</strong> ${window.location.href}</p>
                </div>` : ''}
            </div>`;
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