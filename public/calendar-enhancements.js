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
            }
        }, 500);
    },

    applyColorCoding() {
        // Override event rendering to include colors
        const originalRenderAppointments = window.NotaryCRM.renderAppointments;
        if (originalRenderAppointments) {
            window.NotaryCRM.renderAppointments = function () {
                originalRenderAppointments.call(this);
                CalendarEnhancements.colorizeEvents();
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

        if (conflicts.length > 0) {
            this.showConflictWarning(conflicts, newStart, newEnd);
            return true;
        }

        return false;
    },

    hasTimeOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
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
