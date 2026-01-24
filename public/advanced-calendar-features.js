// ============================================
// ADVANCED CALENDAR FEATURES
// ============================================

const AdvancedCalendarFeatures = {
    defaultBufferTime: 15, // minutes
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    init() {
        this.setupBufferTime();
        this.setupTimezoneSupport();
        this.setupGoogleCalendarSync();
    },

    // ============================================
    // BUFFER TIME
    // ============================================
    setupBufferTime() {
        // Add buffer time setting to calendar form
        const calendarForm = document.getElementById('calendar-form');
        if (calendarForm && !document.getElementById('buffer-time-setting')) {
            this.addBufferTimeControl(calendarForm);
        }

        // Load user preference
        const savedBuffer = localStorage.getItem('calendar_buffer_time');
        if (savedBuffer) {
            this.defaultBufferTime = parseInt(savedBuffer);
        }
    },

    addBufferTimeControl(form) {
        const bufferGroup = document.createElement('div');
        bufferGroup.className = 'form-group';
        bufferGroup.innerHTML = `
            <label class="form-label">
                Tiempo de Preparación (Buffer)
                <span style="font-size: 0.75rem; color: var(--text-light); font-weight: 400;">
                    - Tiempo adicional antes/después de la cita
                </span>
            </label>
            <select class="form-input" id="buffer-time-setting" name="bufferTime">
                <option value="0">Sin buffer</option>
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="15" ${this.defaultBufferTime === 15 ? 'selected' : ''}>15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
            </select>
        `;

        // Insert before submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.parentElement.insertBefore(bufferGroup, submitBtn);
        }

        // Save preference on change
        const select = bufferGroup.querySelector('select');
        select.addEventListener('change', (e) => {
            this.defaultBufferTime = parseInt(e.target.value);
            localStorage.setItem('calendar_buffer_time', this.defaultBufferTime);
            Toast.info('Buffer Time Actualizado', `${this.defaultBufferTime} minutos`);
        });
    },

    applyBufferTime(startDate, endDate, bufferMinutes) {
        const buffer = bufferMinutes || this.defaultBufferTime;
        return {
            start: new Date(startDate.getTime() - buffer * 60000),
            end: new Date(endDate.getTime() + buffer * 60000),
            originalStart: startDate,
            originalEnd: endDate,
            buffer: buffer
        };
    },

    // ============================================
    // TIMEZONE SUPPORT
    // ============================================
    setupTimezoneSupport() {
        this.addTimezoneSelector();
        this.displayTimezoneInfo();
    },

    addTimezoneSelector() {
        const calendarTab = document.getElementById('calendar-tab');
        if (!calendarTab || document.getElementById('timezone-selector')) return;

        const timezones = [
            { value: 'America/New_York', label: 'Eastern Time (ET)' },
            { value: 'America/Chicago', label: 'Central Time (CT)' },
            { value: 'America/Denver', label: 'Mountain Time (MT)' },
            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            { value: 'America/Phoenix', label: 'Arizona (MST)' },
            { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
            { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
            { value: 'Europe/London', label: 'London (GMT/BST)' },
            { value: 'Europe/Paris', label: 'Paris (CET)' },
            { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
            { value: 'Australia/Sydney', label: 'Sydney (AEDT)' }
        ];

        const selector = document.createElement('div');
        selector.id = 'timezone-selector';
        selector.style.cssText = `
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--bg-card);
            border-radius: 8px;
            border: 1px solid var(--color-gray-200);
        `;

        selector.innerHTML = `
            <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.5rem;">
                🌍 Zona Horaria
            </label>
            <select id="timezone-select" class="form-input" style="width: 100%;">
                ${timezones.map(tz => `
                    <option value="${tz.value}" ${tz.value === this.userTimezone ? 'selected' : ''}>
                        ${tz.label}
                    </option>
                `).join('')}
            </select>
            <p style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.5rem;">
                Hora actual: <span id="current-time-display"></span>
            </p>
        `;

        const actionsBar = calendarTab.querySelector('.actions-bar');
        if (actionsBar) {
            actionsBar.after(selector);
        }

        // Update time display
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 60000); // Update every minute

        // Handle timezone change
        const select = document.getElementById('timezone-select');
        select.addEventListener('change', (e) => {
            this.userTimezone = e.target.value;
            localStorage.setItem('user_timezone', this.userTimezone);
            this.updateTimeDisplay();
            Toast.success('Zona Horaria Actualizada', this.getTimezoneName(this.userTimezone));

            // Refresh calendar
            if (window.NotaryCRM && window.NotaryCRM.calendar) {
                window.NotaryCRM.calendar.refetchEvents();
            }
        });

        // Load saved timezone
        const savedTz = localStorage.getItem('user_timezone');
        if (savedTz) {
            this.userTimezone = savedTz;
            select.value = savedTz;
        }
    },

    updateTimeDisplay() {
        const display = document.getElementById('current-time-display');
        if (!display) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            timeZone: this.userTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        display.textContent = timeString;
    },

    displayTimezoneInfo() {
        // Show timezone in appointment details
        document.addEventListener('click', (e) => {
            if (e.target.closest('.fc-event')) {
                setTimeout(() => this.addTimezoneToEventDetails(), 100);
            }
        });
    },

    addTimezoneToEventDetails() {
        // This would add timezone info to event popups/details
        // Implementation depends on calendar library being used
    },

    getTimezoneName(tz) {
        const names = {
            'America/New_York': 'Eastern Time',
            'America/Chicago': 'Central Time',
            'America/Denver': 'Mountain Time',
            'America/Los_Angeles': 'Pacific Time',
            'America/Phoenix': 'Arizona Time',
            'America/Anchorage': 'Alaska Time',
            'Pacific/Honolulu': 'Hawaii Time',
            'Europe/London': 'London Time',
            'Europe/Paris': 'Paris Time',
            'Asia/Tokyo': 'Tokyo Time',
            'Australia/Sydney': 'Sydney Time'
        };
        return names[tz] || tz;
    },

    convertToTimezone(date, targetTimezone) {
        return new Date(date.toLocaleString('en-US', { timeZone: targetTimezone }));
    },

    // ============================================
    // GOOGLE CALENDAR SYNC
    // ============================================
    setupGoogleCalendarSync() {
        this.addGoogleCalendarButton();
    },

    addGoogleCalendarButton() {
        const calendarTab = document.getElementById('calendar-tab');
        if (!calendarTab || document.getElementById('google-cal-sync-btn')) return;

        const syncSection = document.createElement('div');
        syncSection.style.cssText = `
            margin-top: 1rem;
            padding: 1rem;
            background: var(--bg-card);
            border-radius: 8px;
            border: 1px solid var(--color-gray-200);
        `;

        syncSection.innerHTML = `
            <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Sincronización con Google Calendar
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 1rem;">
                Exporta tus citas a Google Calendar con un solo clic
            </p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button 
                    id="google-cal-sync-btn" 
                    class="btn btn-primary"
                    onclick="AdvancedCalendarFeatures.exportToGoogleCalendar()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Exportar Todas las Citas
                </button>
                <button 
                    class="btn btn-secondary"
                    onclick="AdvancedCalendarFeatures.exportSingleEvent()">
                    Exportar Cita Seleccionada
                </button>
            </div>
            <p style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.75rem;">
                💡 Tip: Los archivos .ics se pueden importar directamente en Google Calendar
            </p>
        `;

        const legend = document.getElementById('calendar-legend');
        if (legend) {
            legend.after(syncSection);
        }
    },

    exportToGoogleCalendar() {
        if (!window.NotaryCRM || !window.NotaryCRM.state.appointments) {
            Toast.error('Error', 'No hay citas para exportar');
            return;
        }

        const appointments = window.NotaryCRM.state.appointments;
        if (appointments.length === 0) {
            Toast.warning('Sin Citas', 'No hay citas para exportar');
            return;
        }

        const icsContent = this.generateICS(appointments);
        this.downloadICS(icsContent, 'notary-appointments.ics');

        Toast.success('Exportación Exitosa', `${appointments.length} cita(s) exportadas`);

        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce(`${appointments.length} citas exportadas a Google Calendar`);
        }
    },

    exportSingleEvent(eventId) {
        // This would export a single selected event
        // For now, we'll export the most recent appointment
        if (!window.NotaryCRM || !window.NotaryCRM.state.appointments) {
            Toast.error('Error', 'No hay citas para exportar');
            return;
        }

        const appointments = window.NotaryCRM.state.appointments;
        if (appointments.length === 0) {
            Toast.warning('Sin Citas', 'Selecciona una cita primero');
            return;
        }

        const latestAppointment = appointments[appointments.length - 1];
        const icsContent = this.generateICS([latestAppointment]);
        this.downloadICS(icsContent, `appointment-${latestAppointment.id}.ics`);

        Toast.success('Cita Exportada', latestAppointment.title);
    },

    generateICS(appointments) {
        let ics = 'BEGIN:VCALENDAR\n';
        ics += 'VERSION:2.0\n';
        ics += 'PRODID:-//Notary CRM//Calendar Export//EN\n';
        ics += 'CALSCALE:GREGORIAN\n';
        ics += 'METHOD:PUBLISH\n';

        appointments.forEach(apt => {
            const start = new Date(apt.start);
            const end = new Date(apt.end);

            ics += 'BEGIN:VEVENT\n';
            ics += `UID:${apt.id}@notarycrm.com\n`;
            ics += `DTSTAMP:${this.formatICSDate(new Date())}\n`;
            ics += `DTSTART:${this.formatICSDate(start)}\n`;
            ics += `DTEND:${this.formatICSDate(end)}\n`;
            ics += `SUMMARY:${this.escapeICS(apt.title)}\n`;

            if (apt.description) {
                ics += `DESCRIPTION:${this.escapeICS(apt.description)}\n`;
            }

            if (apt.location) {
                ics += `LOCATION:${this.escapeICS(apt.location)}\n`;
            }

            // Add client info if available
            if (apt.clientId && window.NotaryCRM) {
                const client = window.NotaryCRM.state.clients.find(c => c.id === apt.clientId);
                if (client) {
                    ics += `ORGANIZER;CN=${this.escapeICS(client.name)}:mailto:${client.email}\n`;
                }
            }

            ics += 'STATUS:CONFIRMED\n';
            ics += 'END:VEVENT\n';
        });

        ics += 'END:VCALENDAR';
        return ics;
    },

    formatICSDate(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        return date.getUTCFullYear() +
            pad(date.getUTCMonth() + 1) +
            pad(date.getUTCDate()) + 'T' +
            pad(date.getUTCHours()) +
            pad(date.getUTCMinutes()) +
            pad(date.getUTCSeconds()) + 'Z';
    },

    escapeICS(text) {
        if (!text) return '';
        return text.replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    },

    downloadICS(content, filename) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
};

if (typeof window !== 'undefined') {
    window.AdvancedCalendarFeatures = AdvancedCalendarFeatures;
}
