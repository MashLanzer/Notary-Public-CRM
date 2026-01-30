// ============================================
// CALENDAR ENHANCEMENTS
// ============================================

const CalendarEnhancements = {
    // Color coding by service type
    serviceColors: {
        'Apostille': '#3b82f6',           // Blue
        'Power of Attorney': '#8b5cf6',   // Purple
        'Affidavit': '#06b6d4',           // Cyan
        'Real Estate Deed': '#10b981',    // Green
        'Wills / Trusts': '#f59e0b',      // Amber
        'Certified Copies': '#ec4899',    // Pink
        'Oath / Affirmation': '#6366f1',  // Indigo
        'Loan Signing': '#14b8a6',        // Teal
        'Acknowledgment': '#a855f7',      // Violet
        'Other': '#6b7280'                // Gray
    },

    init() {
        this.enhanceCalendar();
        this.setupConflictDetection();
    },

    enhanceCalendar() {
        // Wait for calendar to be initialized
        const checkCalendar = setInterval(() => {
            if (window.NotaryCRM && window.NotaryCRM.calendar) {
                clearInterval(checkCalendar);
                this.applyColorCoding();
                this.addCalendarLegend();
                this.ensureCalendarUI();
            }
        }, 500);
    },

    ensureCalendarUI() {
        const viewHolder = document.getElementById('calendar-view');
        if (!viewHolder) return;

        if (!document.getElementById('calendar')) {
            const calEl = document.createElement('div');
            calEl.id = 'calendar';
            viewHolder.appendChild(calEl);
        }

        if (!document.getElementById('calendar-toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.id = 'calendar-toolbar';
            toolbar.style.cssText = 'display:flex; gap:12px; margin-bottom:1.5rem; flex-wrap:wrap; align-items:center; background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0;';
            toolbar.innerHTML = `
                <div class="btn-group" style="display:flex; gap:1px; background:#e2e8f0; padding:2px; border-radius:8px;">
                    <button class="btn btn-sm" id="calendar-today-btn" style="border-radius:6px; background:white; margin-right:4px;">Hoy</button>
                    <button class="btn btn-sm" data-view="dayGridMonth" style="border-radius:6px; background:white;">Mes</button>
                    <button class="btn btn-sm" data-view="timeGridWeek" style="border-radius:6px; background:transparent;">Semana</button>
                    <button class="btn btn-sm" data-view="timeGridDay" style="border-radius:6px; background:transparent;">Día</button>
                    <button class="btn btn-sm" data-view="listMonth" style="border-radius:6px; background:transparent;">Agenda</button>
                </div>
                
                <div style="flex:1; min-width:200px; display:flex; gap:8px;">
                     <div class="search-box" style="margin:0; flex:1; position:relative;">
                        <input type="text" id="calendar-search" class="search-input" placeholder="Buscar por cliente o servicio..." style="padding-left:35px !important; width:100%;">
                        <svg class="search-icon" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:#94a3b8;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                     </div>
                </div>

                <div style="display:flex; gap:8px;">
                    <select id="calendar-status-filter" class="form-input" style="width: 160px; margin:0; height:38px;">
                        <option value="all">Todos los estados</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="pending">Pendiente</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="no-show">No-show</option>
                    </select>

                    <button class="btn btn-outline" style="height:38px; display:flex; align-items:center; justify-content:center; width:40px; padding:0;" onclick="NotaryCRM.openModal('calendar-settings-modal')" title="Ajustes">
                        <i data-lucide="settings" style="width:18px; height:18px;"></i>
                    </button>

                    <button class="btn btn-outline" id="calendar-refresh-btn" style="height:38px; display:flex; align-items:center; justify-content:center; width:40px; padding:0;" title="Refrescar">
                        <i data-lucide="refresh-cw" style="width:18px; height:18px;"></i>
                    </button>

                    <button class="btn btn-outline" id="calendar-print-day-btn" style="height:38px; display:flex; align-items:center; justify-content:center; width:40px; padding:0;" title="Imprimir Agenda del Día">
                        <i data-lucide="printer" style="width:18px; height:18px;"></i>
                    </button>
                </div>
            `;
            viewHolder.insertBefore(toolbar, viewHolder.firstChild);

            toolbar.addEventListener('click', (e) => {
                const b = e.target.closest('button[data-view]');
                if (!b || !window.NotaryCRM || !window.NotaryCRM.calendar) return;

                // Update active button state
                toolbar.querySelectorAll('button[data-view]').forEach(btn => btn.style.background = 'transparent');
                b.style.background = 'white';

                window.NotaryCRM.calendar.changeView(b.getAttribute('data-view'));
            });

            const todayBtn = document.getElementById('calendar-today-btn');
            if (todayBtn) {
                todayBtn.onclick = () => {
                    if (window.NotaryCRM && window.NotaryCRM.calendar) window.NotaryCRM.calendar.today();
                };
            }

            const refreshBtn = document.getElementById('calendar-refresh-btn');
            if (refreshBtn) {
                refreshBtn.onclick = () => {
                    if (window.NotaryCRM && window.NotaryCRM.calendar) {
                        window.NotaryCRM.calendar.refetchEvents();
                        Toast.info('Refrescando', 'Sincronizando calendario...');
                    }
                };
            }

            const printBtn = document.getElementById('calendar-print-day-btn');
            if (printBtn) {
                printBtn.onclick = () => {
                    if (window.NotaryCRM && typeof window.NotaryCRM.exportDayAgenda === 'function') {
                        const date = window.NotaryCRM.calendar?.getDate() || new Date();
                        window.NotaryCRM.exportDayAgenda(date.toISOString().split('T')[0]);
                    }
                };
            }

            const searchInput = document.getElementById('calendar-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    if (window.NotaryCRM && window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                });
            }

            const filterEl = document.getElementById('calendar-status-filter');
            if (filterEl) {
                filterEl.addEventListener('change', () => {
                    if (window.NotaryCRM && window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                });
            }

            if (window.lucide) window.lucide.createIcons({ root: toolbar });
        }

        // Initialize FullCalendar instance if not present in NotaryCRM
        if (!window.NotaryCRM.calendar && window.FullCalendar) {
            this.initFullCalendar();
        }
    },

    initFullCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        const settings = (window.NotaryCRM && typeof window.NotaryCRM.loadCalendarSettings === 'function') ? window.NotaryCRM.loadCalendarSettings() : { workStart: '09:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5] };

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: false,
            locale: 'es',
            timeZone: (settings.timezone && settings.timezone !== 'auto') ? settings.timezone : 'local',
            editable: true,
            dayMaxEvents: true,
            eventContent: (arg) => {
                const appt = arg.event.extendedProps;
                const status = (appt.status || 'pending').toLowerCase();
                const title = arg.event.title;
                const timeStr = arg.timeText;

                // Status colors
                const statusColors = {
                    confirmed: '#10b981',
                    pending: '#f59e0b',
                    cancelled: '#94a3b8',
                    'no-show': '#ef4444'
                };
                const color = statusColors[status] || '#3b82f6';

                let html = `
                    <div class="fc-custom-event" style="padding: 2px 4px; border-radius: 4px; color: #fff; width:100%; height:100%;">
                        <div style="font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: space-between; overflow:hidden;">
                            <span>${timeStr ? timeStr + ' ' : ''}${title}</span>
                            <div class="quick-status-bar" style="display:none; gap:2px; background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius:10px;">
                                <span class="qstatus-btn" data-id="${arg.event.id}" data-status="confirmed" title="Confirmar" style="cursor:pointer; opacity:0.7; font-size:10px;">✅</span>
                                <span class="qstatus-btn" data-id="${arg.event.id}" data-status="pending" title="Pendiente" style="cursor:pointer; opacity:0.7; font-size:10px;">⏳</span>
                                <span class="qstatus-btn" data-id="${arg.event.id}" data-status="cancelled" title="Cancelar" style="cursor:pointer; opacity:0.7; font-size:10px;">❌</span>
                            </div>
                        </div>
                        <div style="height:3px; background:${color}; margin-top:2px; border-radius:2px; opacity: 0.8;"></div>
                    </div>
                `;
                return { html: html };
            },
            eventDidMount: (info) => {
                const el = info.el;
                const statusBar = el.querySelector('.quick-status-bar');
                if (statusBar) {
                    el.addEventListener('mouseenter', () => statusBar.style.display = 'flex');
                    el.addEventListener('mouseleave', () => statusBar.style.display = 'none');

                    statusBar.querySelectorAll('.qstatus-btn').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            const id = btn.getAttribute('data-id');
                            const status = btn.getAttribute('data-status');
                            if (window.NotaryCRM && window.NotaryCRM.updateAppointmentStatus) {
                                window.NotaryCRM.updateAppointmentStatus(id, status).then(() => {
                                    window.NotaryCRM.calendar.refetchEvents();
                                    Toast.success('Estado Actualizado', `Cita marcada como ${status}`);
                                });
                            }
                        };
                    });
                }
            },
            datesSet: (info) => {
                try { this.renderDayBadges(); } catch (e) { console.warn('renderDayBadges failed', e); }
            },
            businessHours: {
                daysOfWeek: settings.workDays || [1, 2, 3, 4, 5],
                startTime: settings.workStart || '09:00',
                endTime: settings.workEnd || '18:00'
            },
            events: (fetchInfo, successCallback) => {
                const filter = document.getElementById('calendar-status-filter')?.value || 'all';
                const search = document.getElementById('calendar-search')?.value.toLowerCase() || '';

                const appts = (window.NotaryCRM.state.appointments || []).filter(a => {
                    const matchesStatus = (filter === 'all') || ((a.status || '').toString().toLowerCase() === filter.toLowerCase());
                    const client = window.NotaryCRM.state.clients.find(c => c.id === a.clientId);
                    const clientName = client?.name.toLowerCase() || a.clientName?.toLowerCase() || '';
                    const serviceType = a.type?.toLowerCase() || '';
                    const title = a.title?.toLowerCase() || '';
                    const matchesSearch = !search || clientName.includes(search) || serviceType.includes(search) || title.includes(search);
                    return matchesStatus && matchesSearch;
                }).map(a => {
                    const start = a.date && a.time ? `${a.date}T${a.time}` : (a.start || a.date);
                    return {
                        id: a.id,
                        title: a.title || (window.NotaryCRM.state.clients.find(c => c.id === a.clientId)?.name || 'Cita'),
                        start: start,
                        allDay: !a.time,
                        backgroundColor: a.color || this.serviceColors[a.type] || this.serviceColors['Other'],
                        borderColor: a.color || this.serviceColors[a.type] || this.serviceColors['Other'],
                        extendedProps: a
                    };
                });
                successCallback(appts);
            },
            dateClick: (info) => {
                NotaryCRM.openModal('calendar-modal');
                const form = document.getElementById('calendar-form');
                if (form) {
                    const dateInput = form.querySelector('input[name="date"]');
                    if (dateInput) dateInput.value = info.dateStr.slice(0, 10);
                }
            },
            eventClick: (info) => {
                this.showAppointmentDetails(info.event.id || info.event.extendedProps.id || info.event.extendedProps);
            },
            eventDrop: async (info) => {
                const id = info.event.id;
                const newDate = info.event.start.toISOString().split('T')[0];
                const newTime = info.event.start.toTimeString().split(' ')[0].slice(0, 5);

                if (confirm(`¿Mover cita al ${newDate} a las ${newTime}?`)) {
                    await window.NotaryCRM.updateAppointment(id, {
                        date: newDate,
                        time: newTime
                    });
                } else {
                    info.revert();
                }
            },
            eventResize: async (info) => {
                const id = info.event.id;
                const start = info.event.start;
                const end = info.event.end;
                const duration = Math.round((end - start) / 60000);

                await window.NotaryCRM.updateAppointment(id, {
                    duration: duration
                });
            },
            eventMouseEnter: (info) => {
                this.showEventTooltip(info);
            },
            eventMouseLeave: (info) => {
                this.hideEventTooltip();
            }
        });

        calendar.render();
        window.NotaryCRM.calendar = calendar;
    },

    showAppointmentDetails(appt) {
        if (!appt) return;

        // Use the detail rendering from app.js if available, otherwise fallback
        if (window.NotaryCRM && typeof window.NotaryCRM.showAppointmentDetails === 'function') {
            window.NotaryCRM.showAppointmentDetails(appt.id || appt);
        } else {
            // Fill appointment details modal manually if needed
            NotaryCRM.openModal('appointment-details-modal');
        }
    },

    applyColorCoding() {
        const originalRender = window.NotaryCRM.renderCalendar;
        if (originalRender) {
            // Wrap if needed, but we mostly handle it via FullCalendar events function
        }
    },

    renderDayBadges() {
        const dayCells = document.querySelectorAll('.fc-daygrid-day');
        const appointments = (window.NotaryCRM?.state?.appointments || []).filter(a => a.status !== 'cancelled');

        dayCells.forEach(cell => {
            const date = cell.getAttribute('data-date');
            if (!date) return;

            const dayAppts = appointments.filter(a => a.date === date);
            const count = dayAppts.length;

            // 1. Badge (Number)
            let badge = cell.querySelector('.day-count-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'day-count-badge';
                    badge.style.cssText = 'position:absolute; top:4px; right:4px; background:var(--color-primary); color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:10px; z-index:5; pointer-events:none; box-shadow:0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;';
                    cell.style.position = 'relative';
                    cell.appendChild(badge);
                }
                badge.textContent = count;
                // Premium effect: larger badge if many appointments
                badge.style.transform = count > 3 ? 'scale(1.1)' : 'scale(1)';
            } else if (badge) {
                badge.remove();
            }

            // 2. Heatmap Bar (Visual density)
            let heatmap = cell.querySelector('.day-heatmap-bar');
            if (count > 0) {
                if (!heatmap) {
                    heatmap = document.createElement('div');
                    heatmap.className = 'day-heatmap-bar';
                    heatmap.style.cssText = 'position:absolute; bottom:2px; left:4px; right:4px; height:3px; border-radius:2px; z-index:3; pointer-events:none;';
                    cell.appendChild(heatmap);
                }
                // Color intensity based on density
                let color = '#3b82f6'; // Light blue (1-2)
                if (count >= 3) color = '#f59e0b'; // Amber (3-4)
                if (count >= 5) color = '#ef4444'; // Red (5+)
                heatmap.style.background = color;
                heatmap.style.opacity = Math.min(0.3 + (count * 0.15), 0.9);
            } else if (heatmap) {
                heatmap.remove();
            }
        });
    },

    showDayPopover(date, anchorEl) {
        const pop = document.getElementById('calendar-day-popover');
        if (!pop) {
            const newPop = document.createElement('div');
            newPop.id = 'calendar-day-popover';
            newPop.style.cssText = 'position:fixed; z-index:9999; display:none; background:white; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); padding:12px; min-width:250px;';
            document.body.appendChild(newPop);
        }

        const appts = (window.NotaryCRM.state.appointments || []).filter(a => a.date === date);
        if (appts.length === 0) return;

        const container = document.getElementById('calendar-day-popover');
        container.innerHTML = `<h4 style="margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">${date}</h4>` +
            appts.map(a => `<div style="font-size:0.85rem; margin-bottom:4px;"><strong>${a.time || '--:--'}</strong> ${a.title || a.type}</div>`).join('');

        const rect = anchorEl.getBoundingClientRect();
        container.style.top = `${rect.bottom + 5}px`;
        container.style.left = `${rect.left}px`;
        container.style.display = 'block';
    },

    showEventTooltip(info) {
        let tip = document.getElementById('calendar-event-tooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'calendar-event-tooltip';
            tip.style.cssText = 'position:fixed; z-index:10000; pointer-events:none; background:rgba(15, 23, 42, 0.95); color:white; padding:10px 14px; border-radius:10px; font-size:0.85rem; box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.1); max-width:280px;';
            document.body.appendChild(tip);
        }

        const appt = info.event.extendedProps;
        const client = window.NotaryCRM.state.clients.find(c => c.id === appt.clientId);

        tip.innerHTML = `
            <div style="font-weight:700; margin-bottom:4px; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">${info.event.title}</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; align-items:center; gap:6px; opacity:0.9;"><i data-lucide="user" style="width:12px; height:12px;"></i> ${client ? client.name : (appt.clientName || 'Sin cliente')}</div>
                <div style="display:flex; align-items:center; gap:6px; opacity:0.9;"><i data-lucide="clock" style="width:12px; height:12px;"></i> ${appt.time || '--:--'} (${appt.duration || 30} min)</div>
                <div style="display:flex; align-items:center; gap:6px; opacity:0.9;"><i data-lucide="info" style="width:12px; height:12px;"></i> ${appt.type || 'Servicio'}</div>
                ${appt.note ? `<div style="margin-top:6px; font-size:0.75rem; font-style:italic; opacity:0.7; border-top:1px solid rgba(255,255,255,0.05); padding-top:4px;">${appt.note}</div>` : ''}
            </div>
        `;

        if (window.lucide) window.lucide.createIcons({ root: tip });

        const ev = info.jsEvent;
        tip.style.left = `${ev.clientX + 15}px`;
        tip.style.top = `${ev.clientY + 15}px`;
        tip.style.display = 'block';
    },

    hideEventTooltip() {
        const tip = document.getElementById('calendar-event-tooltip');
        if (tip) tip.style.display = 'none';
    },

    hideDayPopover() {
        const pop = document.getElementById('calendar-day-popover');
        if (pop) pop.style.display = 'none';
    },

    addCalendarLegend() {
        const calendarTab = document.getElementById('calendar-tab');
        if (!calendarTab || document.getElementById('calendar-legend')) return;

        const legend = document.createElement('div');
        legend.id = 'calendar-legend';
        legend.style.cssText = 'margin-top:1.5rem; padding:1.25rem; background:#fff; border-radius:12px; border:1px solid #e2e8f0;';

        let html = '<h4 style="margin-bottom:1rem; font-size:0.95rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="tag" style="width:18px; height:18px;"></i> Leyenda de Servicios</h4>';
        html += '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:0.75rem;">';

        Object.entries(this.serviceColors).forEach(([name, color]) => {
            html += `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:12px; height:12px; border-radius:3px; background:${color};"></div>
                    <span style="font-size:0.8rem; color:#475569;">${name}</span>
                </div>
            `;
        });
        html += '</div>';
        legend.innerHTML = html;

        const view = document.getElementById('calendar-view');
        if (view) view.appendChild(legend);
        if (window.lucide) window.lucide.createIcons({ root: legend });
    },

    setupConflictDetection() {
        // Implement conflict check on appointment save
        const originalSave = window.NotaryCRM.saveAppointment;
        if (originalSave) {
            window.NotaryCRM.saveAppointment = async (apptData) => {
                const appointments = window.NotaryCRM.state.appointments || [];
                const conflict = appointments.find(a =>
                    a.id !== apptData.id &&
                    a.date === apptData.date &&
                    a.time === apptData.time
                );

                if (conflict) {
                    const proceed = confirm(`⚠️ Conflicto detectado: ya hay una cita a las ${apptData.time}. ¿Desea continuar?`);
                    if (!proceed) return;
                }
                return originalSave.call(window.NotaryCRM, apptData);
            };
        }
    },

    getColorForService(serviceType) {
        return this.serviceColors[serviceType] || this.serviceColors['Other'];
    }
};

if (typeof window !== 'undefined') {
    window.CalendarEnhancements = CalendarEnhancements;
}
