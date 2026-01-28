// ============================================
// ADVANCED ANALYTICS & HEATMAPS
// ============================================

const AdvancedAnalytics = {
    init() {
        this.setupHeatmaps();
        this.setupComparisons();
        this.addAnalyticsControls();
    },

    // ============================================
    // HEATMAPS DE OCUPACIÓN
    // ============================================
    setupHeatmaps() {
        this.createHeatmapView();
    },

    createHeatmapView() {
        const calendarTab = document.getElementById('calendar-tab');
        if (!calendarTab || document.getElementById('heatmap-container')) return;

        const heatmapSection = document.createElement('div');
        heatmapSection.id = 'heatmap-container';
        heatmapSection.style.cssText = `
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--bg-card);
            border-radius: 12px;
            border: 1px solid var(--color-gray-200);
        `;

        heatmapSection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">
                    🔥 Mapa de Calor - Ocupación
                </h3>
                <select id="heatmap-period" class="form-input" style="width: auto;">
                    <option value="week">Esta Semana</option>
                    <option value="month" selected>Este Mes</option>
                    <option value="quarter">Este Trimestre</option>
                </select>
            </div>
            <div id="heatmap-grid"></div>
            <div id="heatmap-legend" style="margin-top: 1rem;"></div>
        `;

        const legend = document.getElementById('calendar-legend');
        if (legend) {
            legend.after(heatmapSection);
        }

        this.renderHeatmap('month');

        // Add event listener
        const periodSelect = document.getElementById('heatmap-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.renderHeatmap(e.target.value);
            });
        }
    },

    renderHeatmap(period) {
        const grid = document.getElementById('heatmap-grid');
        if (!grid) return;

        const data = this.getOccupancyData(period);
        const maxValue = Math.max(...data.map(d => d.count));

        let html = '<div style="display: grid; gap: 0.5rem;">';

        if (period === 'week' || period === 'month') {
            // Day/Hour heatmap
            html += this.renderDayHourHeatmap(data, maxValue);
        } else {
            // Monthly heatmap
            html += this.renderMonthlyHeatmap(data, maxValue);
        }

        html += '</div>';
        grid.innerHTML = html;

        this.renderHeatmapLegend(maxValue);
    },

    renderDayHourHeatmap(data, maxValue) {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM - 8 PM

        let html = '<div style="display: grid; grid-template-columns: 60px repeat(7, 1fr); gap: 4px;">';

        // Header row (days)
        html += '<div></div>'; // Empty corner
        days.forEach(day => {
            html += `<div style="text-align: center; font-size: 0.75rem; font-weight: 600; padding: 0.25rem;">${day}</div>`;
        });

        // Hour rows
        hours.forEach(hour => {
            html += `<div style="text-align: right; font-size: 0.7rem; padding: 0.5rem 0.5rem 0.5rem 0; color: var(--text-light);">${hour}:00</div>`;

            days.forEach((day, dayIndex) => {
                const cellData = data.find(d => d.day === dayIndex && d.hour === hour);
                const count = cellData ? cellData.count : 0;
                const intensity = maxValue> 0 ? count / maxValue : 0;
                const color = this.getHeatmapColor(intensity);

                html += `
                    <div 
                        class="heatmap-cell" 
                        style="
                            background: ${color};
                            border-radius: 4px;
                            min-height: 30px;
                            cursor: pointer;
                            transition: transform 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.7rem;
                            font-weight: 600;
                            color: ${intensity> 0.5 ? 'white' : 'var(--text-primary)'};
                        "
                        title="${day} ${hour}:00 - ${count} citas"
                        onmouseover="this.style.transform='scale(1.1)'"
                        onmouseout="this.style.transform='scale(1)'"
                    >
                        ${count> 0 ? count : ''}
                    </div>
                `;
            });
        });

        html += '</div>';
        return html;
    },

    renderMonthlyHeatmap(data, maxValue) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 0.75rem;">';

        months.forEach((month, index) => {
            const cellData = data.find(d => d.month === index);
            const count = cellData ? cellData.count : 0;
            const intensity = maxValue> 0 ? count / maxValue : 0;
            const color = this.getHeatmapColor(intensity);

            html += `
                <div style="
                    background: ${color};
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                "
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.25rem;">${month}</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${count}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    getHeatmapColor(intensity) {
        if (intensity === 0) return 'var(--color-gray-50)';
        if (intensity < 0.2) return '#dbeafe'; // blue-100
        if (intensity < 0.4) return '#93c5fd'; // blue-300
        if (intensity < 0.6) return '#3b82f6'; // blue-500
        if (intensity < 0.8) return '#1d4ed8'; // blue-700
        return '#1e3a8a'; // blue-900
    },

    renderHeatmapLegend(maxValue) {
        const legend = document.getElementById('heatmap-legend');
        if (!legend) return;

        legend.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <span style="font-size: 0.75rem; font-weight: 600;">Intensidad:</span>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 20px; height: 20px; background: var(--color-gray-50); border-radius: 4px;"></div>
                    <span style="font-size: 0.7rem;">0</span>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 20px; height: 20px; background: #dbeafe; border-radius: 4px;"></div>
                    <span style="font-size: 0.7rem;">Bajo</span>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 4px;"></div>
                    <span style="font-size: 0.7rem;">Medio</span>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 20px; height: 20px; background: #1e3a8a; border-radius: 4px;"></div>
                    <span style="font-size: 0.7rem;">Alto (${maxValue})</span>
                </div>
            </div>
        `;
    },

    getOccupancyData(period) {
        if (!window.NotaryCRM || !window.NotaryCRM.state.appointments) {
            return [];
        }

        const appointments = window.NotaryCRM.state.appointments;
        const data = [];

        if (period === 'week' || period === 'month') {
            // Day/Hour data
            for (let day = 0; day < 7; day++) {
                for (let hour = 8; hour < 20; hour++) {
                    const count = appointments.filter(apt => {
                        const date = new Date(apt.start);
                        return date.getDay() === day && date.getHours() === hour;
                    }).length;

                    if (count> 0) {
                        data.push({ day, hour, count });
                    }
                }
            }
        } else {
            // Monthly data
            for (let month = 0; month < 12; month++) {
                const count = appointments.filter(apt => {
                    const date = new Date(apt.start);
                    return date.getMonth() === month;
                }).length;

                if (count> 0) {
                    data.push({ month, count });
                }
            }
        }

        return data;
    },

    // ============================================
    // COMPARATIVAS PERÍODO A PERÍODO
    // ============================================
    setupComparisons() {
        this.createComparisonView();
    },

    createComparisonView() {
        const targetTab = document.getElementById('reports-tab');
        if (!targetTab || document.getElementById('comparison-container')) return;

        const comparisonSection = document.createElement('div');
        comparisonSection.id = 'comparison-container';
        comparisonSection.style.cssText = `
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--bg-card);
            border-radius: 12px;
            border: 1px solid var(--color-gray-200);
        `;

        comparisonSection.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 700;">
                📊 Comparativa Período a Período
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <label class="form-label">Período 1</label>
                    <select id="period1-select" class="form-input">
                        <option value="current-month">Mes Actual</option>
                        <option value="last-month">Mes Anterior</option>
                        <option value="current-quarter">Trimestre Actual</option>
                        <option value="last-quarter">Trimestre Anterior</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Período 2</label>
                    <select id="period2-select" class="form-input">
                        <option value="current-month">Mes Actual</option>
                        <option value="last-month" selected>Mes Anterior</option>
                        <option value="current-quarter">Trimestre Actual</option>
                        <option value="last-quarter">Trimestre Anterior</option>
                    </select>
                </div>
                <div style="display: flex; align-items: flex-end;">
                    <button class="btn btn-primary btn-block" onclick="AdvancedAnalytics.comparePeriodsClick()">
                        Comparar
                    </button>
                </div>
            </div>
            <div id="comparison-results"></div>
        `;

        targetTab.appendChild(comparisonSection);
    },

    comparePeriodsClick() {
        const period1 = document.getElementById('period1-select').value;
        const period2 = document.getElementById('period2-select').value;

        this.comparePeriods(period1, period2);
    },

    comparePeriods(period1, period2) {
        const data1 = this.getPeriodData(period1);
        const data2 = this.getPeriodData(period2);

        const results = document.getElementById('comparison-results');
        if (!results) return;

        const metrics = [
            { key: 'cases', label: 'Casos', format: (v) => v },
            { key: 'revenue', label: 'Ingresos', format: (v) => v.toLocaleString('es-ES', { style: 'currency', currency: 'USD' }) },
            { key: 'clients', label: 'Clientes Nuevos', format: (v) => v },
            { key: 'appointments', label: 'Citas', format: (v) => v }
        ];

        let html = '<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">';

        metrics.forEach(metric => {
            const value1 = data1[metric.key] || 0;
            const value2 = data2[metric.key] || 0;
            const diff = value1 - value2;
            const percentChange = value2 !== 0 ? ((diff / value2) * 100) : 0;
            const isPositive = diff> 0;
            const isNegative = diff < 0;

            html += `
                <div class="stat-card">
                    <div class="stat-label">${metric.label}</div>
                    <div style="display: flex; align-items: baseline; gap: 0.5rem; margin: 0.5rem 0;">
                        <div class="stat-value" style="font-size: 1.5rem;">${metric.format(value1)}</div>
                        <div style="font-size: 0.9rem; color: var(--text-light);">vs ${metric.format(value2)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                        ${isPositive ? `
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" style="width: 16px; height: 16px;">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span style="color: var(--color-success); font-weight: 600;">+${percentChange.toFixed(1)}%</span>
                        ` : isNegative ? `
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" style="width: 16px; height: 16px;">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                            <span style="color: var(--color-danger); font-weight: 600;">${percentChange.toFixed(1)}%</span>
                        ` : `
                            <span style="color: var(--text-light); font-weight: 600;">Sin cambios</span>
                        `}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        results.innerHTML = html;

        Toast.success('Comparación Completada', 'Períodos comparados exitosamente');
    },

    getPeriodData(period) {
        if (!window.NotaryCRM) return {};

        const cases = window.NotaryCRM.state.cases || [];
        const clients = window.NotaryCRM.state.clients || [];
        const appointments = window.NotaryCRM.state.appointments || [];

        // Simplified period filtering
        // In production, this would use actual date ranges
        return {
            cases: cases.length,
            revenue: cases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
            clients: clients.length,
            appointments: appointments.length
        };
    },

    // ============================================
    // ANALYTICS CONTROLS
    // ============================================
    addAnalyticsControls() {
        // Add export button for analytics
        const targetTab = document.getElementById('reports-tab');
        if (!targetTab || document.getElementById('analytics-export-btn')) return;

        const exportBtn = document.createElement('button');
        exportBtn.id = 'analytics-export-btn';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.style.cssText = 'margin-top: 1rem;';
        exportBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar Análisis Completo
        `;
        exportBtn.onclick = () => this.exportFullAnalytics();

        const comparisonContainer = document.getElementById('comparison-container');
        if (comparisonContainer) {
            comparisonContainer.after(exportBtn);
        }
    },

    exportFullAnalytics() {
        const data = {
            heatmap: this.getOccupancyData('month'),
            comparison: this.getPeriodData('current-month'),
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'analytics-export.json';
        link.click();
        URL.revokeObjectURL(link.href);

        Toast.success('Análisis Exportado', 'Datos descargados exitosamente');
    }
};

if (typeof window !== 'undefined') {
    window.AdvancedAnalytics = AdvancedAnalytics;
}
