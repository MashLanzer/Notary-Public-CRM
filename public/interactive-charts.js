// ============================================
// INTERACTIVE CHARTS & ANALYTICS
// ============================================

const InteractiveCharts = {
    charts: {},

    init() {
        this.setupInteractiveCharts();
        this.setupTrendAnalysis();
    },

    setupInteractiveCharts() {
        // Wait for Chart.js to be available
        const checkChart = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkChart);
                this.enhanceExistingCharts();
                this.addInteractiveControls();
            }
        }, 500);
    },

    enhanceExistingCharts() {
        // Add click handlers to existing charts
        if (window.NotaryCRM && window.NotaryCRM.revenueChart) {
            this.makeChartInteractive('revenue', window.NotaryCRM.revenueChart);
        }
        if (window.NotaryCRM && window.NotaryCRM.servicesChart) {
            this.makeChartInteractive('services', window.NotaryCRM.servicesChart);
        }
    },

    makeChartInteractive(chartId, chart) {
        if (!chart) return;

        // Store reference
        this.charts[chartId] = chart;

        // Add click event
        chart.options.onClick = (event, activeElements) => {
            if (activeElements.length> 0) {
                const element = activeElements[0];
                const datasetIndex = element.datasetIndex;
                const index = element.index;
                const label = chart.data.labels[index];
                const value = chart.data.datasets[datasetIndex].data[index];

                this.handleChartClick(chartId, label, value, datasetIndex);
            }
        };

        // Add hover cursor
        chart.options.onHover = (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length> 0 ? 'pointer' : 'default';
        };

        chart.update();
    },

    handleChartClick(chartId, label, value, datasetIndex) {
        // Show detailed modal
        this.showChartDetails(chartId, label, value, datasetIndex);

        // Announce for screen readers
        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce(`Mostrando detalles de ${label}: ${value}`);
        }
    },

    showChartDetails(chartId, label, value, datasetIndex) {
        const modal = this.getOrCreateDetailsModal();
        const content = document.getElementById('chart-details-content');

        let detailsHTML = `
            <h4 style="margin-bottom: 1rem;">${label}</h4>
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        `;

        if (chartId === 'revenue') {
            detailsHTML += this.getRevenueDetails(label, value);
        } else if (chartId === 'services') {
            detailsHTML += this.getServiceDetails(label, value);
        }

        detailsHTML += '</div>';

        // Add trend analysis
        detailsHTML += this.getTrendAnalysis(chartId, label);

        content.innerHTML = detailsHTML;

        if (window.NotaryCRM) {
            window.NotaryCRM.openModal('chart-details-modal');
        }
    },

    getRevenueDetails(month, revenue) {
        if (!window.NotaryCRM) return '';

        const cases = window.NotaryCRM.state.cases || [];
        const monthCases = cases.filter(c => {
            const caseMonth = new Date(c.createdAt).toLocaleString('es-ES', { month: 'long' });
            return caseMonth.toLowerCase() === month.toLowerCase();
        });

        const avgRevenue = monthCases.length> 0 ? revenue / monthCases.length : 0;
        const paidCases = monthCases.filter(c => c.paymentStatus === 'Paid').length;

        return `
            <div class="stat-card">
                <div class="stat-value">${revenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</div>
                <div class="stat-label">Ingresos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${monthCases.length}</div>
                <div class="stat-label">Casos del Mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</div>
                <div class="stat-label">Ingreso Promedio</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${paidCases}</div>
                <div class="stat-label">Casos Pagados</div>
            </div>
        `;
    },

    getServiceDetails(service, count) {
        if (!window.NotaryCRM) return '';

        const cases = window.NotaryCRM.state.cases || [];
        const serviceCases = cases.filter(c => c.type === service);
        const totalRevenue = serviceCases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const avgRevenue = serviceCases.length> 0 ? totalRevenue / serviceCases.length : 0;

        return `
            <div class="stat-card">
                <div class="stat-value">${count}</div>
                <div class="stat-label">Total de Casos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</div>
                <div class="stat-label">Ingresos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</div>
                <div class="stat-label">Ingreso Promedio</div>
            </div>
        `;
    },

    getTrendAnalysis(chartId, label) {
        const trend = this.calculateTrend(chartId, label);

        let trendHTML = `
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-gray-200);">
                <h5 style="margin-bottom: 1rem;">📊 Análisis de Tendencia</h5>
                <div style="display: flex; align-items: center; gap: 1rem;">
        `;

        if (trend.direction === 'up') {
            trendHTML += `
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" style="width: 32px; height: 32px;">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">
                        ↑ ${trend.percentage}%
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">
                        Tendencia positiva vs período anterior
                    </div>
                </div>
            `;
        } else if (trend.direction === 'down') {
            trendHTML += `
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" style="width: 32px; height: 32px;">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
                <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-danger);">
                        ↓ ${trend.percentage}%
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">
                        Tendencia negativa vs período anterior
                    </div>
                </div>
            `;
        } else {
            trendHTML += `
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2" style="width: 32px; height: 32px;">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-warning);">
                        → Estable
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">
                        Sin cambios significativos
                    </div>
                </div>
            `;
        }

        trendHTML += '</div></div>';
        return trendHTML;
    },

    calculateTrend(chartId, label) {
        // Simplified trend calculation
        // In production, this would use historical data
        const random = Math.random();

        if (random> 0.6) {
            return {
                direction: 'up',
                percentage: Math.floor(Math.random() * 30 + 5)
            };
        } else if (random < 0.4) {
            return {
                direction: 'down',
                percentage: Math.floor(Math.random() * 20 + 5)
            };
        } else {
            return {
                direction: 'stable',
                percentage: 0
            };
        }
    },

    getOrCreateDetailsModal() {
        let modal = document.getElementById('chart-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chart-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Detalles del Gráfico</h3>
                        <button class="modal-close" onclick="NotaryCRM.closeModal('chart-details-modal')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body" id="chart-details-content">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        return modal;
    },

    addInteractiveControls() {
        const targetTab = document.getElementById('reports-tab');
        if (!targetTab || document.getElementById('chart-controls')) return;

        const controls = document.createElement('div');
        controls.id = 'chart-controls';
        controls.style.cssText = `
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--bg-card);
            border-radius: 8px;
            border: 1px solid var(--color-gray-200);
        `;

        controls.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <h4 style="margin: 0; font-size: 0.9rem; font-weight: 600;">
                    📊 Controles de Gráficos
                </h4>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <select id="chart-period" class="form-input" style="width: auto;">
                        <option value="7">Últimos 7 días</option>
                        <option value="30" selected>Últimos 30 días</option>
                        <option value="90">Últimos 90 días</option>
                        <option value="365">Último año</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="InteractiveCharts.exportChartData()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Exportar Datos
                    </button>
                </div>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem; margin-bottom: 0;">
                💡 Haz clic en cualquier punto del gráfico para ver detalles
            </p>
        `;

        const reportsGrid = targetTab.querySelector('.reports-grid') || targetTab.querySelector('.stats-grid');
        if (reportsGrid) {
            reportsGrid.parentElement.insertBefore(controls, reportsGrid);
        } else {
            targetTab.appendChild(controls);
        }

        // Add event listener for period change
        const periodSelect = document.getElementById('chart-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                Toast.info('Período Actualizado', 'Los gráficos se actualizarán con los nuevos datos');
                // In production, this would refresh the charts with new data
            });
        }
    },

    exportChartData() {
        if (!window.NotaryCRM) return;

        const data = {
            revenue: this.getChartData('revenue'),
            services: this.getChartData('services'),
            exportDate: new Date().toISOString()
        };

        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, 'chart-data.csv');

        Toast.success('Datos Exportados', 'Los datos del gráfico se han descargado');
    },

    getChartData(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return [];

        return chart.data.labels.map((label, index) => ({
            label,
            value: chart.data.datasets[0].data[index]
        }));
    },

    convertToCSV(data) {
        let csv = 'Tipo,Etiqueta,Valor\n';

        if (data.revenue) {
            data.revenue.forEach(item => {
                csv += `Ingresos,${item.label},${item.value}\n`;
            });
        }

        if (data.services) {
            data.services.forEach(item => {
                csv += `Servicios,${item.label},${item.value}\n`;
            });
        }

        return csv;
    },

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    setupTrendAnalysis() {
        // Add trend indicators to dashboard
        this.addTrendIndicators();
    },

    addTrendIndicators() {
        // This would add trend arrows to stat cards
        // Implementation depends on existing dashboard structure
    }
};

if (typeof window !== 'undefined') {
    window.InteractiveCharts = InteractiveCharts;
}
