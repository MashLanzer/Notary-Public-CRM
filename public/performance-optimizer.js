// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

const PerformanceOptimizer = {
    // Code splitting configuration
    modules: {},
    loadedModules: new Set(),

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCaching();
        this.monitorPerformance();
    },

    // ============================================
    // CODE SPLITTING
    // ============================================
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return this.modules[moduleName];
        }

        console.log(`Loading module: ${moduleName}`);

        try {
            // Simulate dynamic import (in production, use actual dynamic imports)
            const module = await this.importModule(moduleName);
            this.modules[moduleName] = module;
            this.loadedModules.add(moduleName);
            return module;
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            return null;
        }
    },

    async importModule(moduleName) {
        // In production, this would use dynamic import()
        // For now, we'll return the already loaded modules
        const moduleMap = {
            'calendar': window.CalendarEnhancements,
            'charts': window.InteractiveCharts,
            'attachments': window.CaseAttachmentsManager,
            'drafts': window.DraftManager,
            'autocomplete': window.SmartAutocomplete
        };

        return moduleMap[moduleName] || null;
    },

    // ============================================
    // IMAGE OPTIMIZATION
    // ============================================
    setupImageOptimization() {
        // Lazy load images
        this.observeImages();

        // Add loading="lazy" to images
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    },

    observeImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },

    // ============================================
    // CACHING STRATEGY
    // ============================================
    setupCaching() {
        // Cache API responses
        this.cacheManager = {
            cache: new Map(),
            maxAge: 5 * 60 * 1000, // 5 minutes

            set(key, value) {
                this.cache.set(key, {
                    value,
                    timestamp: Date.now()
                });
            },

            get(key) {
                const item = this.cache.get(key);
                if (!item) return null;

                if (Date.now() - item.timestamp > this.maxAge) {
                    this.cache.delete(key);
                    return null;
                }

                return item.value;
            },

            clear() {
                this.cache.clear();
            }
        };

        // Make available globally
        window.CacheManager = this.cacheManager;
    },

    // ============================================
    // PERFORMANCE MONITORING
    // ============================================
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            // Monitor long tasks
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 150) {
                            console.info('Performance note - Long task:', entry);
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // longtask not supported
            }

            // Monitor resource timing
            this.logResourceTiming();
        }

        // Monitor memory usage
        this.monitorMemory();
    },

    logResourceTiming() {
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            const slowResources = resources.filter(r => r.duration > 1000);

            if (slowResources.length > 0) {
                console.warn('Slow resources detected:', slowResources);
            }
        }
    },

    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (usage > 0.9) {
                    console.warn('High memory usage:', (usage * 100).toFixed(2) + '%');
                }
            }, 30000); // Check every 30 seconds
        }
    },

    // ============================================
    // LAZY LOADING COMPONENTS
    // ============================================
    setupLazyLoading() {
        // Lazy load tabs content
        this.lazyLoadTabs();

        // Lazy load modals
        this.lazyLoadModals();
    },

    lazyLoadTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.loadTabContent(tabId);
            });
        });
    },

    async loadTabContent(tabId) {
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (!tabContent) return;

        // Check if already loaded
        if (tabContent.dataset.loaded === 'true') return;

        // Load required modules for this tab
        switch (tabId) {
            case 'calendar':
                await this.loadModule('calendar');
                break;
            case 'dashboard':
                await this.loadModule('charts');
                break;
            case 'cases':
                await this.loadModule('attachments');
                break;
        }

        tabContent.dataset.loaded = 'true';
    },

    lazyLoadModals() {
        // Modals are loaded on demand
        document.addEventListener('click', (e) => {
            const modalTrigger = e.target.closest('[data-modal]');
            if (modalTrigger) {
                const modalId = modalTrigger.dataset.modal;
                this.loadModalContent(modalId);
            }
        });
    },

    async loadModalContent(modalId) {
        // Load required modules for modals
        if (modalId.includes('client')) {
            await this.loadModule('autocomplete');
            await this.loadModule('drafts');
        }
    },

    // ============================================
    // DEBOUNCE & THROTTLE UTILITIES
    // ============================================
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ============================================
    // BUNDLE SIZE ANALYSIS
    // ============================================
    analyzeBundleSize() {
        const scripts = document.querySelectorAll('script[src]');
        let totalSize = 0;

        console.log('📦 Bundle Analysis:');
        scripts.forEach(script => {
            // In production, this would fetch actual sizes
            console.log(`- ${script.src}`);
        });

        return totalSize;
    },

    // ============================================
    // PERFORMANCE METRICS
    // ============================================
    getPerformanceMetrics() {
        if (!window.performance) return null;

        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            // Navigation timing
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart,

            // Paint timing
            fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

            // Total
            total: navigation.loadEventEnd - navigation.fetchStart
        };
    },

    logPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        if (!metrics) return;

        console.log('⚡ Performance Metrics:');
        console.log(`- DNS Lookup: ${metrics.dns.toFixed(2)}ms`);
        console.log(`- TCP Connection: ${metrics.tcp.toFixed(2)}ms`);
        console.log(`- Request: ${metrics.request.toFixed(2)}ms`);
        console.log(`- Response: ${metrics.response.toFixed(2)}ms`);
        console.log(`- DOM Processing: ${metrics.dom.toFixed(2)}ms`);
        console.log(`- First Contentful Paint: ${metrics.fcp.toFixed(2)}ms`);
        console.log(`- Total Load Time: ${metrics.total.toFixed(2)}ms`);

        return metrics;
    }
};

if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}
