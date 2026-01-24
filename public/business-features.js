// ============================================
// BUSINESS FEATURES
// ============================================

const BusinessFeatures = {
    init() {
        this.setupReferralProgram();
        this.setupPublicBooking();
        this.setupReviewsSystem();
        this.setupBlogResources();
    },

    // ============================================
    // REFERRAL PROGRAM
    // ============================================
    setupReferralProgram() {
        this.referrals = new Map(); // userId -> referrals[]
        this.referralCodes = new Map(); // code -> userId
        this.loadReferrals();
    },

    loadReferrals() {
        const stored = localStorage.getItem('referrals');
        if (stored) {
            const data = JSON.parse(stored);
            this.referrals = new Map(Object.entries(data.referrals || {}));
            this.referralCodes = new Map(Object.entries(data.codes || {}));
        }
    },

    generateReferralCode(userId, userName) {
        const code = userName.substring(0, 3).toUpperCase() +
            Math.random().toString(36).substring(2, 8).toUpperCase();

        this.referralCodes.set(code, userId);
        this.saveReferrals();

        console.log(`🎁 Referral code generated: ${code}`);
        Toast.success('Código de Referido', `Tu código: ${code}`);

        return code;
    },

    applyReferralCode(code, newUserId) {
        const referrerId = this.referralCodes.get(code);

        if (!referrerId) {
            Toast.error('Código Inválido', 'El código de referido no existe');
            return false;
        }

        const referrals = this.referrals.get(referrerId) || [];
        referrals.push({
            id: newUserId,
            code,
            date: new Date().toISOString(),
            reward: 50, // $50 discount
            status: 'pending'
        });

        this.referrals.set(referrerId, referrals);
        this.saveReferrals();

        Toast.success('¡Código Aplicado!', 'Recibirás $50 de descuento');

        return true;
    },

    getReferralStats(userId) {
        const referrals = this.referrals.get(userId) || [];

        return {
            total: referrals.length,
            pending: referrals.filter(r => r.status === 'pending').length,
            completed: referrals.filter(r => r.status === 'completed').length,
            totalRewards: referrals.reduce((sum, r) => sum + (r.reward || 0), 0)
        };
    },

    saveReferrals() {
        const data = {
            referrals: Object.fromEntries(this.referrals),
            codes: Object.fromEntries(this.referralCodes)
        };
        localStorage.setItem('referrals', JSON.stringify(data));
    },

    createReferralUI() {
        const modal = document.createElement('div');
        modal.id = 'referral-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">🎁 Programa de Referidos</h3>
                    <button class="modal-close" onclick="NotaryCRM.closeModal('referral-modal')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 2rem;">
                        <h4 style="margin-bottom: 1rem;">¡Gana $50 por cada referido!</h4>
                        <p style="color: var(--text-light); margin-bottom: 2rem;">
                            Comparte tu código y ambos recibirán $50 de descuento
                        </p>
                        <div style="background: var(--color-gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">
                                Tu código de referido:
                            </div>
                            <div id="referral-code-display" style="font-size: 2rem; font-weight: 700; color: var(--color-primary); letter-spacing: 2px;">
                                LOADING...
                            </div>
                            <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="BusinessFeatures.copyReferralCode()">
                                📋 Copiar Código
                            </button>
                        </div>
                        <div id="referral-stats" class="stats-grid" style="grid-template-columns: repeat(3, 1fr);"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    copyReferralCode() {
        const codeElement = document.getElementById('referral-code-display');
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.textContent);
            Toast.success('Código Copiado', 'Compártelo con tus amigos');
        }
    },

    // ============================================
    // PUBLIC BOOKING PAGE
    // ============================================
    setupPublicBooking() {
        this.bookingSettings = {
            enabled: true,
            publicUrl: 'https://notarycrm.com/book/user123',
            availableServices: [],
            workingHours: {
                monday: { start: '09:00', end: '17:00', enabled: true },
                tuesday: { start: '09:00', end: '17:00', enabled: true },
                wednesday: { start: '09:00', end: '17:00', enabled: true },
                thursday: { start: '09:00', end: '17:00', enabled: true },
                friday: { start: '09:00', end: '17:00', enabled: true },
                saturday: { start: '10:00', end: '14:00', enabled: false },
                sunday: { start: '00:00', end: '00:00', enabled: false }
            }
        };
    },

    generatePublicBookingPage() {
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendar Cita - Notary Public</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .booking-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 3rem;
        }
        h1 { color: #333; margin-bottom: 0.5rem; }
        .subtitle { color: #666; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }
        input, select, textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 1rem;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
    <div class="booking-container">
        <h1>📅 Agendar Cita</h1>
        <p class="subtitle">Reserva tu cita de notaría en minutos</p>
        
        <form id="booking-form">
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" name="name" required>
            </div>
            
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" name="phone" required>
            </div>
            
            <div class="form-group">
                <label>Servicio</label>
                <select name="service" required>
                    <option value="">Seleccionar...</option>
                    <option value="Apostille">Apostille</option>
                    <option value="Power of Attorney">Power of Attorney</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Real Estate Deed">Real Estate Deed</option>
                    <option value="Other">Otro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Fecha Preferida</label>
                <input type="date" name="date" required>
            </div>
            
            <div class="form-group">
                <label>Hora Preferida</label>
                <input type="time" name="time" required>
            </div>
            
            <div class="form-group">
                <label>Notas (Opcional)</label>
                <textarea name="notes" rows="3"></textarea>
            </div>
            
            <button type="submit" class="btn">Confirmar Cita</button>
        </form>
    </div>
    
    <script>
        document.getElementById('booking-form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Cita solicitada! Te contactaremos pronto para confirmar.');
        });
    </script>
</body>
</html>
        `;

        return html;
    },

    downloadBookingPage() {
        const html = this.generatePublicBookingPage();
        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'booking-page.html';
        link.click();
        URL.revokeObjectURL(link.href);

        Toast.success('Página Generada', 'Página de reservas descargada');
    },

    // ============================================
    // REVIEWS & TESTIMONIALS
    // ============================================
    setupReviewsSystem() {
        this.reviews = [];
        this.loadReviews();
    },

    loadReviews() {
        const stored = localStorage.getItem('reviews');
        if (stored) {
            this.reviews = JSON.parse(stored);
        }
    },

    addReview(clientId, rating, comment) {
        const review = {
            id: 'rev_' + Date.now(),
            clientId,
            rating,
            comment,
            date: new Date().toISOString(),
            approved: false,
            featured: false
        };

        this.reviews.unshift(review);
        localStorage.setItem('reviews', JSON.stringify(this.reviews));

        Toast.success('Reseña Recibida', 'Gracias por tu feedback');

        return review;
    },

    approveReview(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
            review.approved = true;
            localStorage.setItem('reviews', JSON.stringify(this.reviews));
            Toast.success('Reseña Aprobada', 'La reseña es ahora pública');
        }
    },

    getAverageRating() {
        const approved = this.reviews.filter(r => r.approved);
        if (approved.length === 0) return 0;

        const sum = approved.reduce((acc, r) => acc + r.rating, 0);
        return (sum / approved.length).toFixed(1);
    },

    getFeaturedReviews(limit = 3) {
        return this.reviews
            .filter(r => r.approved && r.featured)
            .slice(0, limit);
    },

    generateReviewsWidget() {
        const avgRating = this.getAverageRating();
        const featured = this.getFeaturedReviews();

        return `
            <div class="reviews-widget" style="padding: 2rem; background: var(--bg-card); border-radius: 12px;">
                <h3 style="margin-bottom: 1rem;">⭐ Reseñas de Clientes</h3>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; font-weight: 700;">${avgRating}</div>
                    <div>
                        <div>${'⭐'.repeat(Math.round(avgRating))}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">
                            ${this.reviews.filter(r => r.approved).length} reseñas
                        </div>
                    </div>
                </div>
                <div style="display: grid; gap: 1rem;">
                    ${featured.map(r => `
                        <div style="padding: 1rem; background: var(--bg-app); border-radius: 8px;">
                            <div style="margin-bottom: 0.5rem;">${'⭐'.repeat(r.rating)}</div>
                            <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${r.comment}</p>
                            <div style="font-size: 0.75rem; color: var(--text-light);">
                                ${new Date(r.date).toLocaleDateString()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ============================================
    // BLOG / RESOURCES
    // ============================================
    setupBlogResources() {
        this.blogPosts = [];
        this.resources = [];
        this.loadBlog();
    },

    loadBlog() {
        const stored = localStorage.getItem('blog_posts');
        if (stored) {
            this.blogPosts = JSON.parse(stored);
        } else {
            // Add sample posts
            this.blogPosts = [
                {
                    id: 'post1',
                    title: 'Guía Completa de Apostillas',
                    slug: 'guia-apostillas',
                    excerpt: 'Todo lo que necesitas saber sobre el proceso de apostilla de documentos.',
                    content: 'Contenido completo del artículo...',
                    author: 'Admin',
                    date: new Date().toISOString(),
                    category: 'Guías',
                    tags: ['apostilla', 'documentos', 'internacional'],
                    published: true
                },
                {
                    id: 'post2',
                    title: 'Power of Attorney: Cuándo y Cómo',
                    slug: 'power-of-attorney-guia',
                    excerpt: 'Aprende cuándo necesitas un poder notarial y cómo obtenerlo.',
                    content: 'Contenido completo del artículo...',
                    author: 'Admin',
                    date: new Date().toISOString(),
                    category: 'Guías',
                    tags: ['poder', 'legal', 'documentos'],
                    published: true
                }
            ];
            localStorage.setItem('blog_posts', JSON.stringify(this.blogPosts));
        }
    },

    createBlogPost(title, content, category, tags) {
        const post = {
            id: 'post_' + Date.now(),
            title,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
            excerpt: content.substring(0, 150) + '...',
            content,
            author: window.NotaryCRM?.currentUser?.displayName || 'Admin',
            date: new Date().toISOString(),
            category,
            tags,
            published: false,
            views: 0
        };

        this.blogPosts.unshift(post);
        localStorage.setItem('blog_posts', JSON.stringify(this.blogPosts));

        Toast.success('Artículo Creado', 'El artículo ha sido guardado');

        return post;
    },

    publishBlogPost(postId) {
        const post = this.blogPosts.find(p => p.id === postId);
        if (post) {
            post.published = true;
            localStorage.setItem('blog_posts', JSON.stringify(this.blogPosts));
            Toast.success('Artículo Publicado', 'El artículo es ahora público');
        }
    },

    getPublishedPosts(limit = 10) {
        return this.blogPosts
            .filter(p => p.published)
            .slice(0, limit);
    },

    generateBlogHTML() {
        const posts = this.getPublishedPosts();

        return `
            <div class="blog-container" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
                <h1 style="margin-bottom: 2rem;">📚 Blog y Recursos</h1>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
                    ${posts.map(post => `
                        <article style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="padding: 1.5rem;">
                                <div style="font-size: 0.75rem; color: #667eea; font-weight: 600; margin-bottom: 0.5rem;">
                                    ${post.category}
                                </div>
                                <h2 style="font-size: 1.25rem; margin-bottom: 0.75rem;">
                                    ${post.title}
                                </h2>
                                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                                    ${post.excerpt}
                                </p>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #999;">
                                    <span>${new Date(post.date).toLocaleDateString()}</span>
                                    <span>${post.views} vistas</span>
                                </div>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.BusinessFeatures = BusinessFeatures;
}
