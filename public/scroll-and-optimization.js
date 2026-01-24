// ============================================
// INFINITE SCROLL & PAGINATION
// ============================================

const InfiniteScroll = {
    observers: new Map(),
    pageSize: 20,
    currentPages: new Map(),

    init() {
        this.setupInfiniteScroll();
    },

    setupInfiniteScroll() {
        // Setup for clients list
        this.enableInfiniteScroll('clients-list', 'clients');

        // Setup for cases list
        this.enableInfiniteScroll('cases-list', 'cases');

        // Setup for appointments list
        this.enableInfiniteScroll('appointments-list', 'appointments');
    },

    enableInfiniteScroll(containerId, dataType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Initialize page counter
        this.currentPages.set(dataType, 1);

        // Create sentinel element
        const sentinel = document.createElement('div');
        sentinel.id = `${containerId}-sentinel`;
        sentinel.style.cssText = 'height: 1px; margin: 1rem 0;';
        container.appendChild(sentinel);

        // Create observer
        const observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries, dataType, container),
            { rootMargin: '100px' }
        );

        observer.observe(sentinel);
        this.observers.set(dataType, observer);

        // Load initial data
        this.loadMoreData(dataType, container);
    },

    handleIntersection(entries, dataType, container) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadMoreData(dataType, container);
            }
        });
    },

    async loadMoreData(dataType, container) {
        if (!window.NotaryCRM || !window.NotaryCRM.state) return;

        const currentPage = this.currentPages.get(dataType) || 1;
        const allData = window.NotaryCRM.state[dataType] || [];

        const start = (currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = allData.slice(start, end);

        if (pageData.length === 0) return; // No more data

        // Show loading indicator
        this.showLoadingIndicator(container);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Render data
        this.renderPageData(dataType, pageData, container);

        // Hide loading indicator
        this.hideLoadingIndicator(container);

        // Increment page
        this.currentPages.set(dataType, currentPage + 1);

        // Announce for screen readers
        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce(`${pageData.length} elementos más cargados`);
        }
    },

    renderPageData(dataType, data, container) {
        const sentinel = container.querySelector(`#${container.id}-sentinel`);

        data.forEach(item => {
            const element = this.createItemElement(dataType, item);
            if (sentinel) {
                container.insertBefore(element, sentinel);
            } else {
                container.appendChild(element);
            }
        });
    },

    createItemElement(dataType, item) {
        const div = document.createElement('div');
        div.className = `${dataType.slice(0, -1)}-card card`;
        div.dataset.id = item.id;

        // Simplified rendering - in production, use actual rendering logic
        div.innerHTML = `
            <div style="padding: 1rem;">
                <h4>${item.name || item.title || item.caseNumber || 'Item'}</h4>
                <p style="font-size: 0.85rem; color: var(--text-light);">
                    ${item.email || item.type || item.status || ''}
                </p>
            </div>
        `;

        return div;
    },

    showLoadingIndicator(container) {
        let indicator = container.querySelector('.loading-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'loading-indicator';
            indicator.style.cssText = `
                text-align: center;
                padding: 1rem;
                color: var(--text-light);
                font-size: 0.85rem;
            `;
            indicator.innerHTML = `
                <div class="spinner" style="
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--color-gray-200);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                "></div>
                <span style="margin-left: 0.5rem;">Cargando más...</span>
            `;
            container.appendChild(indicator);
        }
        indicator.style.display = 'block';
    },

    hideLoadingIndicator(container) {
        const indicator = container.querySelector('.loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    },

    reset(dataType) {
        this.currentPages.set(dataType, 1);
        const observer = this.observers.get(dataType);
        if (observer) {
            observer.disconnect();
        }
    }
};

// ============================================
// IMAGE OPTIMIZATION
// ============================================

const ImageOptimizer = {
    init() {
        this.optimizeImages();
        this.setupLazyLoading();
        this.addImageCompression();
    },

    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            // Add loading="lazy"
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Add decoding="async"
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }

            // Add proper alt text if missing
            if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', 'Image');
            }
        });
    },

    setupLazyLoading() {
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

    addImageCompression() {
        // Add event listener for file uploads
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.accept?.includes('image')) {
                this.compressImages(e.target.files);
            }
        });
    },

    async compressImages(files) {
        const compressed = [];

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const compressedFile = await this.compressImage(file);
                compressed.push(compressedFile);
            } else {
                compressed.push(file);
            }
        }

        return compressed;
    },

    async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    },

    // Convert images to WebP format (if supported)
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    },

    getOptimizedImageURL(url) {
        if (this.supportsWebP() && !url.includes('.webp')) {
            // In production, this would request WebP version from CDN
            return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        }
        return url;
    }
};

// ============================================
// DATABASE INDEXING HELPER
// ============================================

const DatabaseIndexing = {
    indexes: {
        clients: ['email', 'phone', 'createdAt'],
        cases: ['caseNumber', 'status', 'clientId', 'createdAt'],
        appointments: ['clientId', 'start', 'status']
    },

    init() {
        this.logIndexRecommendations();
    },

    logIndexRecommendations() {
        console.log('📊 Firestore Index Recommendations:');
        console.log('');
        console.log('Collection: clients');
        console.log('  - Single field indexes: email, phone, createdAt');
        console.log('  - Composite: (ownerId, createdAt DESC)');
        console.log('');
        console.log('Collection: cases');
        console.log('  - Single field indexes: caseNumber, status, clientId, createdAt');
        console.log('  - Composite: (ownerId, status, createdAt DESC)');
        console.log('  - Composite: (clientId, createdAt DESC)');
        console.log('');
        console.log('Collection: appointments');
        console.log('  - Single field indexes: clientId, start, status');
        console.log('  - Composite: (ownerId, start ASC)');
        console.log('  - Composite: (clientId, start ASC)');
    },

    getIndexedQuery(collection, filters) {
        // Helper to build optimized queries
        let query = collection;

        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator, filter.value);
        });

        return query;
    }
};

if (typeof window !== 'undefined') {
    window.InfiniteScroll = InfiniteScroll;
    window.ImageOptimizer = ImageOptimizer;
    window.DatabaseIndexing = DatabaseIndexing;
}
