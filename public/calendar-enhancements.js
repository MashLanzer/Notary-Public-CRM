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

            if (!document.getElementById('calendar-views-toggle')) {
                const toolbar = document.createElement('div');
                toolbar.id = 'calendar-views-toggle';
                toolbar.style.cssText = 'display:flex; gap:8px; margin-bottom:8px; align-items:center;';
                toolbar.innerHTML = `
                    <button class="btn" data-view="dayGridMonth">Mes</button>
                    <button class="btn" data-view="timeGridWeek">Semana</button>
                    <button class="btn" data-view="timeGridDay">Día</button>
                    <button class="btn" data-view="listDay">Agenda</button>
                `;
                viewHolder.insertBefore(toolbar, viewHolder.firstChild);

                toolbar.addEventListener('click', (e) => {
                    const b = e.target.closest('button[data-view]');
                    if (!b || !window.NotaryCRM || !window.NotaryCRM.calendar) return;
                    window.NotaryCRM.calendar.changeView(b.getAttribute('data-view'));
                });
            }

            // Add status filter UI
            if (!document.getElementById('calendar-status-filter')) {
                const filterEl = document.createElement('select');
                filterEl.id = 'calendar-status-filter';
                filterEl.className = 'form-input';
                filterEl.style.cssText = 'width: 160px; margin-left: auto;';
                filterEl.innerHTML = `
                    <option value="all">Todos los estados</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no-show">No-show</option>
                `;
                // Place filter in the toolbar area
                const toolbarArea = document.getElementById('calendar-views-toggle');
                if (toolbarArea) toolbarArea.appendChild(filterEl);

                filterEl.addEventListener('change', () => {
                    if (window.NotaryCRM && window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                });
            }

            // Initialize FullCalendar instance if not present
            if (!window.NotaryCRM.calendar && window.FullCalendar) {
                const calendarEl = document.getElementById('calendar');
                const calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    headerToolbar: false,
                    editable: true,
                    dayMaxEventRows: false,
                    events: (fetchInfo, successCallback) => {
                        const filter = document.getElementById('calendar-status-filter')?.value || 'all';
                        const appts = (window.NotaryCRM.state.appointments || []).filter(a => {
                            if (filter === 'all') return true;
                            return (a.status || '').toString() === filter;
                        }).map(a => {
                            const start = a.date && a.time ? new Date(a.date + 'T' + a.time) : new Date(a.start || a.date || Date.now());
                            return {
                                id: a.id,
                                title: a.title || (window.NotaryCRM.state.clients.find(c=>c.id===a.clientId)?.name || 'Cita'),
                                start: start,
                                allDay: false,
                                extendedProps: a
                            };
                        });
                        successCallback(appts);
                    },
                    eventContent: function(arg) {
                        const appt = arg.event.extendedProps || {};
                        const title = document.createElement('div');
                        title.style.display = 'flex';
                        title.style.alignItems = 'center';
                        title.style.gap = '6px';

                        const t = document.createElement('span');
                        t.textContent = arg.event.title;
                        t.style.fontSize = '0.78rem';
                        t.style.fontWeight = '500';

                        title.appendChild(t);

                        // Status badge
                        const status = (appt.status || '').toString();
                        if (status) {
                            const b = document.createElement('span');
                            b.className = `cal-badge ${status.replace(/\s+/g,'-')}`;
                            b.textContent = status;
                            title.appendChild(b);
                        }

                        // Priority badge
                        if (appt.priority) {
                            const p = document.createElement('span');
                            p.className = `cal-badge priority-${(appt.priority||'low').toString().toLowerCase()}`;
                            p.textContent = appt.priority;
                            title.appendChild(p);
                        }

                        return { domNodes: [title] };
                    },
                    dateClick: (info) => {
                        NotaryCRM.openModal('calendar-modal');
                        const form = document.getElementById('calendar-form');
                        if (form) {
                            const dateInput = form.querySelector('input[name="date"]');
                            const timeInput = form.querySelector('input[name="time"]');
                            if (dateInput) dateInput.value = info.dateStr.slice(0,10);
                            if (timeInput) timeInput.value = '09:00';
                        }
                    },
                    eventClick: (info) => {
                        const appt = info.event.extendedProps || {};
                        // Open quick-edit modal and populate fields
                        const modalId = 'event-quick-edit-modal';
                        NotaryCRM.openModal(modalId);
                        const hid = document.getElementById('quick-edit-id');
                        const statusSel = document.getElementById('quick-edit-status');
                        const prioSel = document.getElementById('quick-edit-priority');
                        const noteInput = document.getElementById('quick-edit-note');
                        if (hid) hid.value = appt.id || info.event.id || '';
                        if (statusSel) statusSel.value = (appt.status || 'pending').toString();
                        if (prioSel) prioSel.value = (appt.priority || 'Low').toString();
                        if (noteInput) noteInput.value = appt.note || '';

                        const saveBtn = document.getElementById('quick-edit-save');
                        if (saveBtn) {
                            saveBtn.onclick = () => {
                                const id = document.getElementById('quick-edit-id').value;
                                const status = document.getElementById('quick-edit-status').value;
                                const priority = document.getElementById('quick-edit-priority').value;
                                const note = document.getElementById('quick-edit-note').value;

                                const appts = window.NotaryCRM.state.appointments || [];
                                const idx = appts.findIndex(a => (a.id || a._id || '') === (id || info.event.id));
                                if (idx > -1) {
                                    appts[idx].status = status;
                                    appts[idx].priority = priority;
                                    appts[idx].note = note;
                                } else {
                                    // fallback: update extendedProps if in-memory only
                                    info.event.setExtendedProp('status', status);
                                    info.event.setExtendedProp('priority', priority);
                                    info.event.setExtendedProp('note', note);
                                }

                                // Close modal and refresh calendar view
                                NotaryCRM.closeModal(modalId);
                                if (window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                                Toast.success('Actualizado', 'Cita actualizada correctamente');
                            };
                        }
                    },
                    eventDrop: (info) => {
                        const ev = info.event;
                        const newStart = new Date(ev.start);
                        const newEnd = ev.end ? new Date(ev.end) : new Date(newStart.getTime() + 60*60000);
                        const appts = window.NotaryCRM.state.appointments || [];
                        const conflict = appts.some(a => {
                            if (a.id === ev.id) return false;
                            const aStart = new Date(a.date + 'T' + (a.time || '00:00'));
                            const aEnd = new Date(aStart.getTime() + (a.duration||60)*60000);
                            return CalendarEnhancements.hasTimeOverlap(newStart, newEnd, aStart, aEnd);
                        });
                        if (conflict) {
                            Toast.error('Conflicto', 'La nueva hora se solapa con otra cita.');
                            info.revert();
                        } else {
                            const idx = appts.findIndex(a=>a.id===ev.id);
                            if (idx>-1) {
                                appts[idx].date = newStart.toISOString().slice(0,10);
                                appts[idx].time = newStart.toTimeString().slice(0,5);
                            }
                            if (window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                        }
                    },
                    eventResize: (info) => {
                        const ev = info.event;
                        const newStart = new Date(ev.start);
                        const newEnd = new Date(ev.end || newStart.getTime()+60*60000);
                        const appts = window.NotaryCRM.state.appointments || [];
                        const conflict = appts.some(a => {
                            if (a.id === ev.id) return false;
                            const aStart = new Date(a.date + 'T' + (a.time || '00:00'));
                            const aEnd = new Date(aStart.getTime() + (a.duration||60)*60000);
                            return CalendarEnhancements.hasTimeOverlap(newStart, newEnd, aStart, aEnd);
                        });
                        if (conflict) {
                            Toast.error('Conflicto', 'La nueva duración se solapa con otra cita.');
                            info.revert();
                        } else {
                            const idx = appts.findIndex(a=>a.id===ev.id);
                            if (idx>-1) {
                                appts[idx].duration = Math.round((newEnd-newStart)/60000);
                            }
                            if (window.NotaryCRM.calendar) window.NotaryCRM.calendar.refetchEvents();
                        }
                    }
                });

                calendar.render();
                window.NotaryCRM.calendar = calendar;

                document.addEventListener('click', (e) => {
                    const ind = e.target.closest('.day-more-indicator');
                    if (!ind) return;
                    const dayFrame = ind.closest('.fc-daygrid-day-frame');
                    if (!dayFrame) return;
                    const dateAttr = dayFrame.closest('.fc-daygrid-day')?.getAttribute('data-date') || '';
                    NotaryCRM.openModal('calendar-day-modal');
                    const list = document.getElementById('day-appointments-list');
                    const title = document.getElementById('calendar-day-date');
                    if (title) title.textContent = `Citas del día ${dateAttr}`;
                    if (list) {
                        list.innerHTML = '';
                        const appts = (window.NotaryCRM.state.appointments || []).filter(a => a.date === dateAttr);
                        appts.forEach(a => {
                            const client = window.NotaryCRM.state.clients.find(c=>c.id===a.clientId);
                            const el = document.createElement('div');
                            el.className = 'reminder-item';
                            el.style.cssText = 'padding:8px;border-bottom:1px solid #f1f5f9;';
                            el.innerHTML = `<div style="display:flex; justify-content:space-between; gap:8px;"><div><strong>${a.title|| (client?client.name:'Cliente')}</strong><div style='font-size:0.85rem; color:var(--text-muted)'>${a.time || ''} · ${a.type || ''}</div></div><div><button class='btn btn-sm' onclick="NotaryCRM.openEditModal('${a.id}')">Ver</button></div></div>`;
                            list.appendChild(el);
                        });
                    }
                });
            }
        },

    applyColorCoding() {
        // Override event rendering to include colors
        const originalRenderAppointments = window.NotaryCRM.renderAppointments;
        if (originalRenderAppointments) {
            window.NotaryCRM.renderAppointments = function () {
                originalRenderAppointments.call(this);
                CalendarEnhancements.colorizeEvents();
                // After events render, collapse overflowing day event lists
                setTimeout(() => CalendarEnhancements.collapseDayEvents(), 50);
            };
        }
    },

    colorizeEvents() {
        if (!window.NotaryCRM || !window.NotaryCRM.calendar) return;

        const events = window.NotaryCRM.calendar.getEvents();
        events.forEach(event => {
            const serviceType = event.extendedProps?.serviceType || 'Other';
            const color = this.serviceColors[serviceType] || this.serviceColors['Other'];

            event.setProp('backgroundColor', color);
            event.setProp('borderColor', color);
        });
    },

    // Limita visualmente la altura de la lista de eventos por día y añade un indicador "+N más"
    collapseDayEvents() {
        const dayFrames = document.querySelectorAll('.fc-daygrid-day-frame');
        dayFrames.forEach(frame => {
            const eventsContainer = frame.querySelector('.fc-daygrid-day-events');
            if (!eventsContainer) return;

            // Ensure container has relative positioning for absolute indicator
            eventsContainer.style.position = 'relative';

            // Remove existing indicator
            const old = eventsContainer.querySelector('.day-more-indicator');
            if (old) old.remove();

            const events = Array.from(eventsContainer.querySelectorAll('.fc-daygrid-event'));
            if (events.length === 0) return;

            const containerHeight = eventsContainer.clientHeight;
            let hiddenCount = 0;

            for (let ev of events) {
                const evBottom = ev.offsetTop + ev.offsetHeight;
                if (evBottom > containerHeight - 2) { // small tolerance
                    hiddenCount++;
                }
            }

            if (hiddenCount > 0) {
                const indicator = document.createElement('div');
                indicator.className = 'day-more-indicator';
                indicator.textContent = `+${hiddenCount} más`;
                eventsContainer.appendChild(indicator);
            }
        });
    },

    addCalendarLegend() {
        const calendarTab = document.getElementById('calendar-tab');
        if (!calendarTab || document.getElementById('calendar-legend')) return;

        const legend = document.createElement('div');
        legend.id = 'calendar-legend';
        legend.style.cssText = `
            margin-top: 1rem;
            padding: 1rem;
            background: var(--bg-card);
            border-radius: 8px;
            border: 1px solid var(--color-gray-200);
        `;

        let legendHTML = '<h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; font-weight: 600;">Leyenda de Servicios</h4>';
        legendHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">';

        Object.entries(this.serviceColors).forEach(([service, color]) => {
            legendHTML += `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background: ${color};"></div>
                    <span style="font-size: 0.8rem;">${service}</span>
                </div>
            `;
        });

        legendHTML += '</div>';
        legend.innerHTML = legendHTML;

        const calendarContainer = calendarTab.querySelector('#calendar');
        if (calendarContainer) {
            calendarContainer.parentElement.appendChild(legend);
        }
    },

    setupConflictDetection() {
        // Monitor form submission for conflicts
        const calendarForm = document.getElementById('calendar-form');
        if (calendarForm) {
            calendarForm.addEventListener('submit', (e) => {
                const hasConflict = this.checkForConflicts(new FormData(calendarForm));
                if (hasConflict) {
                    e.preventDefault();
                }
            });
        }
    },

    checkForConflicts(formData) {
        if (!window.NotaryCRM) return false;

        const newStart = new Date(formData.get('start'));
        const newEnd = new Date(formData.get('end'));
        const editingId = formData.get('id');

        const appointments = window.NotaryCRM.state.appointments || [];
        const conflicts = [];

        appointments.forEach(apt => {
            // Skip if editing the same appointment
            if (editingId && apt.id === editingId) return;

            const aptStart = new Date(apt.start);
            const aptEnd = new Date(apt.end);

            // Check for overlap
            if (this.hasTimeOverlap(newStart, newEnd, aptStart, aptEnd)) {
                conflicts.push(apt);
            }
        });

        if (conflicts.length> 0) {
            this.showConflictWarning(conflicts, newStart, newEnd);
            return true;
        }

        return false;
    },

    hasTimeOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1> start2;
    },

    showConflictWarning(conflicts, newStart, newEnd) {
        const conflictList = conflicts.map(apt => {
            const client = window.NotaryCRM.state.clients.find(c => c.id === apt.clientId);
            const clientName = client ? client.name : 'Cliente Desconocido';
            const time = new Date(apt.start).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `• ${time} - ${clientName} (${apt.title})`;
        }).join('\n');

        const message = `⚠️ CONFLICTO DE HORARIO DETECTADO\n\n` +
            `La cita que intentas crear se solapa con:\n\n${conflictList}\n\n` +
            `¿Deseas continuar de todas formas?`;

        if (confirm(message)) {
            // Allow submission
            const form = document.getElementById('calendar-form');
            if (form) {
                // Temporarily remove event listener
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.submit();
            }
        }

        // Announce for screen readers
        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce(
                `Conflicto de horario detectado. ${conflicts.length} cita(s) se solapan.`,
                'assertive'
            );
        }
    },

    // Buffer time functionality
    addBufferTime(date, minutes = 15) {
        return new Date(date.getTime() + minutes * 60000);
    },

    suggestNextAvailableSlot(preferredStart, duration = 60) {
        if (!window.NotaryCRM) return preferredStart;

        const appointments = window.NotaryCRM.state.appointments || [];
        let currentSlot = new Date(preferredStart);
        const slotEnd = new Date(currentSlot.getTime() + duration * 60000);

        let attempts = 0;
        const maxAttempts = 20; // Check up to 20 slots

        while (attempts < maxAttempts) {
            const hasConflict = appointments.some(apt => {
                const aptStart = new Date(apt.start);
                const aptEnd = new Date(apt.end);
                return this.hasTimeOverlap(currentSlot, slotEnd, aptStart, aptEnd);
            });

            if (!hasConflict) {
                return currentSlot;
            }

            // Move to next 30-minute slot
            currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
            attempts++;
        }

        return preferredStart; // Return original if no slot found
    },

    getColorForService(serviceType) {
        return this.serviceColors[serviceType] || this.serviceColors['Other'];
    }
};

if (typeof window !== 'undefined') {
    window.CalendarEnhancements = CalendarEnhancements;
}
