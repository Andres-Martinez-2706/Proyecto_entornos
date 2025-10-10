/**
 * Notifications - Gestión de notificaciones
 */

const Notifications = {
    currentNotifications: [],
    currentFilter: 'all',

    /**
     * Inicializar página de notificaciones
     */
    async init() {
        this.setupEventListeners();
        await this.loadNotifications();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón marcar todas como leídas
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Filtros
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover clase active de todos
                filterButtons.forEach(b => b.classList.remove('active'));
                // Agregar clase active al clickeado
                e.currentTarget.classList.add('active');
                
                const filter = e.currentTarget.getAttribute('data-filter');
                this.currentFilter = filter;
                this.filterNotifications();
            });
        });

        // Botón confirmar eliminación
        const confirmDeleteBtn = document.getElementById('confirmDeleteNotificationBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDeleteNotification());
        }

        // Botón ir a cita desde detalle
        const goToAppointmentBtn = document.getElementById('goToAppointmentBtn');
        if (goToAppointmentBtn) {
            goToAppointmentBtn.addEventListener('click', () => {
                UI.closeModal('notificationDetailModal');
                window.location.href = 'appointments.html';
            });
        }
    },

    /**
     * Cargar notificaciones
     */
    async loadNotifications() {
        const loading = document.getElementById('notificationsLoading');
        const empty = document.getElementById('notificationsEmpty');
        const list = document.getElementById('notificationsList');

        try {
            UI.showLoading('notificationsLoading');
            UI.hideEmpty('notificationsEmpty');
            if (list) list.style.display = 'none';

            this.currentNotifications = await API.getMyNotifications(false);

            UI.hideLoading('notificationsLoading');

            if (!this.currentNotifications || this.currentNotifications.length === 0) {
                UI.showEmpty('notificationsEmpty');
            } else {
                this.updateCounts();
                this.filterNotifications();
            }

            // Actualizar badge global
            UI.updateNotificationBadge();
        } catch (error) {
            UI.hideLoading('notificationsLoading');
            console.error('Error al cargar notificaciones:', error);
            UI.alert('Error al cargar las notificaciones');
        }
    },

    /**
     * Actualizar contadores de filtros
     */
    updateCounts() {
        const all = this.currentNotifications.length;
        const unread = this.currentNotifications.filter(n => !n.isRead).length;
        const admin = this.currentNotifications.filter(n => 
            n.type === 'ADMIN_MODIFICATION' || n.type === 'ADMIN_CANCELLATION'
        ).length;

        const allCount = document.getElementById('allCount');
        const unreadCount = document.getElementById('unreadCount');
        const adminCount = document.getElementById('adminCount');

        if (allCount) allCount.textContent = all;
        if (unreadCount) unreadCount.textContent = unread;
        if (adminCount) adminCount.textContent = admin;
    },

    /**
     * Filtrar notificaciones
     */
    filterNotifications() {
        const list = document.getElementById('notificationsList');
        const empty = document.getElementById('notificationsEmpty');

        if (!list) return;

        let filtered = this.currentNotifications;

        // Aplicar filtro
        if (this.currentFilter === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
        } else if (this.currentFilter === 'admin') {
            filtered = filtered.filter(n => 
                n.type === 'ADMIN_MODIFICATION' || n.type === 'ADMIN_CANCELLATION'
            );
        }

        if (filtered.length === 0) {
            list.style.display = 'none';
            UI.showEmpty('notificationsEmpty');
        } else {
            UI.hideEmpty('notificationsEmpty');
            list.innerHTML = filtered.map(n => this.createNotificationCard(n)).join('');
            list.style.display = 'flex';
        }
    },

    /**
     * Crear card de notificación
     */
    createNotificationCard(notification) {
        const typeClass = UI.getNotificationTypeClass(notification.type);
        const typeText = UI.getNotificationTypeText(notification.type);
        const unreadClass = notification.isRead ? '' : 'unread';
        const adminClass = (notification.type === 'ADMIN_MODIFICATION' || notification.type === 'ADMIN_CANCELLATION') ? 'admin' : '';

        return `
            <div class="notification-card ${unreadClass} ${adminClass}" 
                 data-id="${notification.id}"
                 onclick="Notifications.viewNotification(${notification.id})">
                <div class="notification-header">
                    <span class="notification-type ${typeClass}">${typeText}</span>
                    <span class="notification-time">${UI.formatRelativeTime(notification.createdAt)}</span>
                </div>
                <p class="notification-message">${UI.escapeHtml(notification.message)}</p>
                ${notification.appointment ? `
                    <small style="color: var(--text-secondary);">
                        📅 Relacionada con: ${UI.escapeHtml(notification.appointment.title)}
                    </small>
                ` : ''}
                <div class="notification-actions">
                    ${!notification.isRead ? `
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); Notifications.markAsRead(${notification.id})">
                            ✓ Marcar como leída
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); Notifications.showDeleteModal(${notification.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Ver detalle de notificación
     */
    async viewNotification(notificationId) {
        try {
            const notification = await API.getNotificationById(notificationId);

            const content = document.getElementById('notificationDetailContent');
            const goToAppointmentBtn = document.getElementById('goToAppointmentBtn');

            if (!content) return;

            const typeClass = UI.getNotificationTypeClass(notification.type);
            const typeText = UI.getNotificationTypeText(notification.type);

            content.innerHTML = `
                <div class="detail-section">
                    <div class="detail-row">
                        <span class="detail-label">Tipo:</span>
                        <span class="detail-value">
                            <span class="notification-type ${typeClass}">${typeText}</span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha:</span>
                        <span class="detail-value">${UI.formatDateTime(notification.createdAt)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">${notification.isRead ? '✓ Leída' : '○ No leída'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Mensaje</div>
                    <p style="white-space: pre-wrap;">${UI.escapeHtml(notification.message)}</p>
                </div>

                ${notification.appointment ? `
                    <div class="detail-section">
                        <div class="detail-section-title">Cita Relacionada</div>
                        <div class="detail-row">
                            <span class="detail-label">Título:</span>
                            <span class="detail-value">${UI.escapeHtml(notification.appointment.title)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Fecha:</span>
                            <span class="detail-value">${UI.formatDate(notification.appointment.date)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Hora:</span>
                            <span class="detail-value">${UI.formatTime(notification.appointment.startTime)} - ${UI.formatTime(notification.appointment.endTime)}</span>
                        </div>
                    </div>
                ` : ''}
            `;

            // Mostrar/ocultar botón ir a cita
            if (goToAppointmentBtn) {
                if (notification.appointment) {
                    goToAppointmentBtn.style.display = 'inline-flex';
                    goToAppointmentBtn.setAttribute('data-appointment-id', notification.appointment.id);
                } else {
                    goToAppointmentBtn.style.display = 'none';
                }
            }

            UI.openModal('notificationDetailModal');

            // Marcar como leída automáticamente si no lo está
            if (!notification.isRead) {
                await this.markAsRead(notificationId, false);
            }
        } catch (error) {
            console.error('Error al cargar notificación:', error);
            UI.alert('Error al cargar los detalles de la notificación');
        }
    },

    /**
     * Marcar notificación como leída
     */
    async markAsRead(notificationId, reload = true) {
        try {
            await API.markNotificationAsRead(notificationId);

            if (reload) {
                await this.loadNotifications();
            } else {
                // Actualizar solo el estado local
                const notification = this.currentNotifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.isRead = true;
                }
                this.updateCounts();
                UI.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            if (reload) {
                UI.alert('Error al marcar la notificación como leída');
            }
        }
    },

    /**
     * Marcar todas como leídas
     */
    async markAllAsRead() {
        if (!UI.confirm('¿Marcar todas las notificaciones como leídas?')) {
            return;
        }

        try {
            await API.markAllNotificationsAsRead();
            await this.loadNotifications();
            UI.alert('Todas las notificaciones han sido marcadas como leídas');
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            UI.alert('Error al marcar las notificaciones como leídas');
        }
    },

    /**
     * Mostrar modal de confirmación de eliminación
     */
    showDeleteModal(notificationId) {
        document.getElementById('deleteNotificationId').value = notificationId;
        UI.clearError('deleteNotificationError');
        UI.openModal('deleteNotificationModal');
    },

    /**
     * Eliminar notificación
     */
    async handleDeleteNotification() {
        const notificationId = document.getElementById('deleteNotificationId').value;
        const confirmBtn = document.getElementById('confirmDeleteNotificationBtn');

        UI.clearError('deleteNotificationError');
        UI.disableButton(confirmBtn, 'Eliminando...');

        try {
            await API.deleteNotification(notificationId);
            UI.closeModal('deleteNotificationModal');
            await this.loadNotifications();
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            UI.showError('deleteNotificationError', error.message || 'Error al eliminar la notificación');
        } finally {
            UI.enableButton(confirmBtn);
        }
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'notifications.html') {
        Notifications.init();
    }
});

// Exportar para uso global
window.Notifications = Notifications;