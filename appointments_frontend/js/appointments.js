/**
 * Appointments - Gestión de citas
 */

const Appointments = {
    categories: [],
    currentAppointments: [],
    currentFilter: 'Pendiente',
    includeDeleted: true,

    /**
     * Inicializar página de home
     */
    async initHome() {
        try {
            await this.loadUpcomingAppointments();
            
            // Si es admin, cargar estadísticas
            if (Auth.isAdmin()) {
                await this.loadAdminStats();
            }
        } catch (error) {
            console.error('Error al inicializar home:', error);
        }
    },

    /**
     * Cargar citas próximas (home.html)
     */
    async loadUpcomingAppointments() {
        const loading = document.getElementById('upcomingLoading');
        const empty = document.getElementById('upcomingEmpty');
        const list = document.getElementById('upcomingList');

        try {
            UI.showLoading('upcomingLoading');
            UI.hideEmpty('upcomingEmpty');
            if (list) list.style.display = 'none';

            const appointments = await API.getUpcomingAppointments();

            UI.hideLoading('upcomingLoading');

            if (!appointments || appointments.length === 0) {
                UI.showEmpty('upcomingEmpty');
            } else {
                if (list) {
                    list.innerHTML = appointments.map(apt => this.createAppointmentCard(apt, true)).join('');
                    list.style.display = 'flex';
                }
            }
        } catch (error) {
            UI.hideLoading('upcomingLoading');
            console.error('Error al cargar citas próximas:', error);
            UI.alert('Error al cargar las citas próximas');
        }
    },

    /**
     * Cargar estadísticas admin (home.html)
     */
    async loadAdminStats() {
        const statsSection = document.getElementById('adminStats');
        if (!statsSection) return;

        statsSection.style.display = 'block';

        try {
            // Obtener todas las citas
            const allAppointments = await API.getAppointments(true);
            const activeAppointments = allAppointments.filter(apt => 
                !apt.deleted && (apt.status === 'Pendiente' || apt.status === 'Confirmada')
            );

            // Obtener estadísticas de usuarios
            const userStats = await API.getUserStats();

            // Obtener notificaciones no leídas (aproximado)
            const unreadCount = await API.getUnreadCount();

            // Actualizar DOM
            document.getElementById('totalAppointments').textContent = allAppointments.length;
            document.getElementById('activeAppointments').textContent = activeAppointments.length;
            document.getElementById('totalUsers').textContent = userStats.totalUsers || 0;
            document.getElementById('pendingNotifications').textContent = unreadCount.count || 0;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    },

    /**
     * Inicializar página de appointments
     */
    async initAppointments() {
        // Cargar categorías
        await this.loadCategories();

        // Event listeners
        this.setupAppointmentEventListeners();

        // Cargar citas
        await this.loadAppointments();
    },

    /**
     * Configurar event listeners de appointments
     */
    setupAppointmentEventListeners() {
        // Botón crear cita
        const createBtn = document.getElementById('createAppointmentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Filtro de estado
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterAppointments();
            });
        }

        // Filtro incluir eliminadas
        const includeDeletedFilter = document.getElementById('includeDeletedFilter');
        if (includeDeletedFilter) {
            includeDeletedFilter.addEventListener('change', (e) => {
                this.includeDeleted = e.target.checked;
                this.loadAppointments();
            });
        }

        // Form crear/editar cita
        const appointmentForm = document.getElementById('appointmentForm');
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => this.handleSaveAppointment(e));
        }

        // Form editar por admin
        const adminEditForm = document.getElementById('adminEditForm');
        if (adminEditForm) {
            adminEditForm.addEventListener('submit', (e) => this.handleAdminEdit(e));
        }

        // Botón confirmar eliminación
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDeleteAppointment());
        }

        // Establecer fecha mínima en formularios (hoy)
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['appointmentDate', 'adminEditDate'];
        dateInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.min = today;
        });
    },

    /**
     * Cargar categorías
     */
    async loadCategories() {
        try {
            this.categories = await API.getCategories();
            console.log('Categorías cargadas:', this.categories);
            this.populateCategorySelects();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this.categories = [];
        }
    },

    /**
     * Poblar selects de categoría
     */
    populateCategorySelects() {
        const selects = ['appointmentCategory', 'adminEditCategory'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            // Guardar valor actual
            const currentValue = select.value;

            // Limpiar opciones existentes (excepto la primera)
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Agregar categorías
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });

            // Restaurar valor si existe
            if (currentValue) {
                select.value = currentValue;
            }
        });
    },

    /**
     * Recargar categorías (llamar desde otras páginas si es necesario)
     */
    async reloadCategories() {
        await this.loadCategories();
    },

    /**
     * Cargar citas
     */
    async loadAppointments() {
        const loading = document.getElementById('appointmentsLoading');
        const empty = document.getElementById('appointmentsEmpty');
        const grid = document.getElementById('appointmentsGrid');

        try {
            UI.showLoading('appointmentsLoading');
            UI.hideEmpty('appointmentsEmpty');
            if (grid) grid.style.display = 'none';

            console.log('Cargando citas, includeDeleted:', this.includeDeleted);
            this.currentAppointments = await API.getAppointments(this.includeDeleted);
            console.log('Citas cargadas:', this.currentAppointments);

            UI.hideLoading('appointmentsLoading');

            if (!this.currentAppointments || this.currentAppointments.length === 0) {
                UI.showEmpty('appointmentsEmpty');
            } else {
                this.filterAppointments();
            }
        } catch (error) {
            UI.hideLoading('appointmentsLoading');
            console.error('Error al cargar citas:', error);
            UI.alert(`Error al cargar las citas: ${error.message}`);
        }
    },

    /**
     * Filtrar citas
     */
    filterAppointments() {
        const grid = document.getElementById('appointmentsGrid');
        const empty = document.getElementById('appointmentsEmpty');

        if (!grid) return;

        let filtered = this.currentAppointments;

        // Filtrar por estado
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === this.currentFilter);
        }

        if (filtered.length === 0) {
            grid.style.display = 'none';
            UI.showEmpty('appointmentsEmpty');
        } else {
            UI.hideEmpty('appointmentsEmpty');
            grid.innerHTML = filtered.map(apt => this.createAppointmentCard(apt, false)).join('');
            grid.style.display = 'grid';
        }
    },

    /**
     * Crear card de cita
     */
    createAppointmentCard(appointment, isCompact = false) {
        const statusClass = UI.getAppointmentStatusClass(appointment.status);
        const statusEmoji = UI.getAppointmentStatusEmoji(appointment.status);
        const isAdmin = Auth.isAdmin();
        const session = Auth.getSession();
        const isOwner = appointment.user && appointment.user.id == session.userId;

        // Determinar si se pueden hacer acciones
        const canEdit = !appointment.deleted && (isOwner || isAdmin);
        const canDelete = !appointment.deleted && (isOwner || isAdmin);

        const card = `
            <div class="appointment-card status-${statusClass} ${appointment.deleted ? 'deleted' : ''}" data-id="${appointment.id}">
                <div class="appointment-header">
                    <div>
                        <h3 class="appointment-title">${UI.escapeHtml(appointment.title)}</h3>
                        ${appointment.category ? `<small>📁 ${UI.escapeHtml(appointment.category.name)}</small>` : ''}
                    </div>
                    <span class="appointment-status ${statusClass}">${statusEmoji} ${appointment.status}</span>
                </div>
                
                <div class="appointment-info">
                    <div class="appointment-info-item">
                        <strong>📅 Fecha:</strong> ${UI.formatDate(appointment.date)}
                    </div>
                    <div class="appointment-info-item">
                        <strong>🕐 Hora:</strong> ${UI.formatTime(appointment.startTime)} - ${UI.formatTime(appointment.endTime)}
                    </div>
                    ${isAdmin && appointment.user ? `
                        <div class="appointment-info-item">
                            <strong>👤 Usuario:</strong> ${UI.escapeHtml(appointment.user.fullName)}
                        </div>
                    ` : ''}
                </div>

                ${appointment.description ? `
                    <p class="appointment-description">${UI.escapeHtml(appointment.description)}</p>
                ` : ''}

                ${appointment.adminObservation ? `
                    <div class="appointment-observation">
                        <strong>⚠️ Observación del administrador:</strong>
                        <p>${UI.escapeHtml(appointment.adminObservation)}</p>
                    </div>
                ` : ''}

                ${appointment.deleted ? `
                    <div class="appointment-observation">
                        <strong>❌ Cita eliminada</strong>
                        <p>Eliminada el ${UI.formatDateTime(appointment.deletedAt)}</p>
                    </div>
                ` : ''}

                <div class="appointment-actions">
                    <button class="btn btn-sm btn-outline" onclick="Appointments.viewDetails(${appointment.id})">
                        👁️ Ver detalles
                    </button>
                    ${canEdit ? `
                        <button class="btn btn-sm btn-primary" onclick="Appointments.showEditModal(${appointment.id})">
                            ✏️ ${isAdmin ? 'Editar (Admin)' : 'Editar'}
                        </button>
                    ` : ''}
                    ${canDelete ? `
                        <button class="btn btn-sm btn-danger" onclick="Appointments.showDeleteModal(${appointment.id})">
                            🗑️ Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        return card;
    },

    /**
     * Mostrar modal de creación
     */
    showCreateModal() {
        const modal = document.getElementById('appointmentModal');
        const modalTitle = document.getElementById('appointmentModalTitle');
        const form = document.getElementById('appointmentForm');

        if (!modal || !form) return;

        // Limpiar formulario
        form.reset();
        document.getElementById('appointmentId').value = '';
        modalTitle.textContent = 'Nueva Cita';
        UI.clearError('appointmentError');

        // Establecer fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').value = today;

        UI.openModal('appointmentModal');
    },

    /**
     * Mostrar modal de edición
     */
    async showEditModal(appointmentId) {
        const isAdmin = Auth.isAdmin();

        // Si es admin, usar modal especial
        if (isAdmin) {
            await this.showAdminEditModal(appointmentId);
            return;
        }

        // Modal normal para usuario
        try {
            const appointment = await API.getAppointmentById(appointmentId);

            const modal = document.getElementById('appointmentModal');
            const modalTitle = document.getElementById('appointmentModalTitle');

            modalTitle.textContent = 'Editar Cita';

            // Llenar formulario
            document.getElementById('appointmentId').value = appointment.id;
            document.getElementById('appointmentTitle').value = appointment.title;
            document.getElementById('appointmentDescription').value = appointment.description || '';
            document.getElementById('appointmentDate').value = appointment.date;
            document.getElementById('appointmentStartTime').value = appointment.startTime;
            document.getElementById('appointmentEndTime').value = appointment.endTime;
            document.getElementById('appointmentCategory').value = appointment.category?.id || '';

            UI.clearError('appointmentError');
            UI.openModal('appointmentModal');
        } catch (error) {
            console.error('Error al cargar cita:', error);
            UI.alert('Error al cargar los datos de la cita');
        }
    },

    /**
     * Mostrar modal de edición por admin
     */
    async showAdminEditModal(appointmentId) {
        try {
            const appointment = await API.getAppointmentById(appointmentId);

            // Llenar formulario admin
            document.getElementById('adminEditId').value = appointment.id;
            document.getElementById('adminEditTitle').value = appointment.title;
            document.getElementById('adminEditDescription').value = appointment.description || '';
            document.getElementById('adminEditDate').value = appointment.date;
            document.getElementById('adminEditStartTime').value = appointment.startTime;
            document.getElementById('adminEditEndTime').value = appointment.endTime;
            document.getElementById('adminEditCategory').value = appointment.category?.id || '';
            document.getElementById('adminObservation').value = '';

            UI.clearError('adminEditError');
            UI.openModal('adminEditModal');
        } catch (error) {
            console.error('Error al cargar cita:', error);
            UI.alert('Error al cargar los datos de la cita');
        }
    },

    /**
     * Guardar cita (crear o editar)
     */
    async handleSaveAppointment(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const appointmentId = document.getElementById('appointmentId').value;
        const isEdit = !!appointmentId;

        const session = Auth.getSession();

        const appointmentData = {
            title: document.getElementById('appointmentTitle').value.trim(),
            description: document.getElementById('appointmentDescription').value.trim(),
            date: document.getElementById('appointmentDate').value,
            startTime: document.getElementById('appointmentStartTime').value,
            endTime: document.getElementById('appointmentEndTime').value,
            user: { id: parseInt(session.userId) },
            category: null
        };

        const categoryId = document.getElementById('appointmentCategory').value;
        if (categoryId) {
            appointmentData.category = { id: parseInt(categoryId) };
        }

        UI.clearError('appointmentError');
        UI.disableButton(submitBtn, 'Guardando...');

        try {
            if (isEdit) {
                appointmentData.id = parseInt(appointmentId);
                await API.updateAppointment(appointmentId, appointmentData);
            } else {
                await API.createAppointment(appointmentData);
            }

            UI.closeModal('appointmentModal');
            UI.alert(isEdit ? 'Cita actualizada exitosamente' : 'Cita creada exitosamente');
            
            // Recargar citas
            await this.loadAppointments();
            
            // Si estamos en home, recargar citas próximas
            if (window.location.pathname.includes('home.html')) {
                await this.loadUpcomingAppointments();
            }
        } catch (error) {
            console.error('Error al guardar cita:', error);
            UI.showError('appointmentError', error.message || 'Error al guardar la cita');
        } finally {
            UI.enableButton(submitBtn);
        }
    },

    /**
     * Guardar edición por admin
     */
    async handleAdminEdit(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const appointmentId = document.getElementById('adminEditId').value;
        const adminObservation = document.getElementById('adminObservation').value.trim();

        if (!adminObservation) {
            UI.showError('adminEditError', 'La observación del administrador es obligatoria');
            return;
        }

        // Obtener datos originales para mantener el usuario
        let originalAppointment;
        try {
            originalAppointment = await API.getAppointmentById(appointmentId);
        } catch (error) {
            UI.showError('adminEditError', 'Error al cargar datos de la cita');
            return;
        }

        const appointmentData = {
            id: parseInt(appointmentId),
            title: document.getElementById('adminEditTitle').value.trim(),
            description: document.getElementById('adminEditDescription').value.trim(),
            date: document.getElementById('adminEditDate').value,
            startTime: document.getElementById('adminEditStartTime').value,
            endTime: document.getElementById('adminEditEndTime').value,
            user: originalAppointment.user,
            category: null
        };

        const categoryId = document.getElementById('adminEditCategory').value;
        if (categoryId) {
            appointmentData.category = { id: parseInt(categoryId) };
        }

        UI.clearError('adminEditError');
        UI.disableButton(submitBtn, 'Guardando...');

        try {
            await API.updateAppointmentByAdmin(appointmentId, appointmentData, adminObservation);

            UI.closeModal('adminEditModal');
            UI.alert('Cita modificada por administrador. Se ha enviado notificación al usuario.');
            
            // Recargar citas
            await this.loadAppointments();
        } catch (error) {
            console.error('Error al guardar cita:', error);
            UI.showError('adminEditError', error.message || 'Error al guardar la cita');
        } finally {
            UI.enableButton(submitBtn);
        }
    },

    /**
     * Mostrar modal de confirmación de eliminación
     */
    async showDeleteModal(appointmentId) {
        const isAdmin = Auth.isAdmin();

        try {
            const appointment = await API.getAppointmentById(appointmentId);

            if (!appointment) {
                UI.alert('No se pudo cargar la cita');
                return;
            }

            document.getElementById('deleteAppointmentId').value = appointmentId;
            
            const deleteMessage = document.getElementById('deleteMessage');
            deleteMessage.textContent = `¿Estás seguro de eliminar la cita "${appointment.title}"?`;

            // Si es admin, mostrar campo de observación
            const observationGroup = document.getElementById('deleteObservationGroup');
            const observationField = document.getElementById('deleteObservation');
            
            if (isAdmin) {
                observationGroup.style.display = 'block';
                observationField.value = '';
                observationField.required = true;
            } else {
                observationGroup.style.display = 'none';
                observationField.required = false;
            }

            UI.clearError('deleteError');
            UI.openModal('deleteModal');
        } catch (error) {
            console.error('Error al cargar cita:', error);
            UI.alert(`Error al cargar los datos de la cita: ${error.message}`);
        }
    },

    /**
     * Eliminar cita
     */
    async handleDeleteAppointment() {
        const appointmentId = document.getElementById('deleteAppointmentId').value;
        const isAdmin = Auth.isAdmin();
        const confirmBtn = document.getElementById('confirmDeleteBtn');

        // Si es admin, validar observación
        let adminObservation = null;
        if (isAdmin) {
            adminObservation = document.getElementById('deleteObservation').value.trim();
            if (!adminObservation) {
                UI.showError('deleteError', 'La observación es obligatoria para cancelaciones de admin');
                return;
            }
        }

        UI.clearError('deleteError');
        UI.disableButton(confirmBtn, 'Eliminando...');

        try {
            if (isAdmin && adminObservation) {
                await API.deleteAppointmentByAdmin(appointmentId, adminObservation);
                UI.alert('Cita cancelada por administrador. Se ha enviado notificación al usuario.');
            } else {
                await API.deleteAppointment(appointmentId);
                UI.alert('Cita eliminada exitosamente');
            }

            UI.closeModal('deleteModal');
            
            // Recargar citas
            await this.loadAppointments();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            UI.showError('deleteError', error.message || 'Error al eliminar la cita');
        } finally {
            UI.enableButton(confirmBtn);
        }
    },

    /**
     * Ver detalles de cita
     */
    async viewDetails(appointmentId) {
        try {
            const appointment = await API.getAppointmentById(appointmentId);

            const content = document.getElementById('detailsContent');
            if (!content) return;

            const categoryText = appointment.category ? UI.escapeHtml(appointment.category.name) : 'Sin categoría';
            const userText = appointment.user ? UI.escapeHtml(appointment.user.fullName) : '-';
            const statusEmoji = UI.getAppointmentStatusEmoji(appointment.status);

            content.innerHTML = `
                <div class="detail-section">
                    <div class="detail-row">
                        <span class="detail-label">Título:</span>
                        <span class="detail-value">${UI.escapeHtml(appointment.title)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">${statusEmoji} ${appointment.status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Categoría:</span>
                        <span class="detail-value">${categoryText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Usuario:</span>
                        <span class="detail-value">${userText}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Horario</div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha:</span>
                        <span class="detail-value">${UI.formatDate(appointment.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Hora inicio:</span>
                        <span class="detail-value">${UI.formatTime(appointment.startTime)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Hora fin:</span>
                        <span class="detail-value">${UI.formatTime(appointment.endTime)}</span>
                    </div>
                </div>

                ${appointment.description ? `
                    <div class="detail-section">
                        <div class="detail-section-title">Descripción</div>
                        <p>${UI.escapeHtml(appointment.description)}</p>
                    </div>
                ` : ''}

                ${appointment.adminObservation ? `
                    <div class="detail-section">
                        <div class="observation-box">
                            <strong>⚠️ Observación del administrador:</strong>
                            <p>${UI.escapeHtml(appointment.adminObservation)}</p>
                        </div>
                    </div>
                ` : ''}

                ${appointment.deleted ? `
                    <div class="detail-section">
                        <div class="observation-box">
                            <strong>❌ Cita eliminada</strong>
                            <p>Eliminada el ${UI.formatDateTime(appointment.deletedAt)}</p>
                            ${appointment.cancelledBy ? `
                                <p>Por: ${UI.escapeHtml(appointment.cancelledBy.fullName)}</p>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-section">
                    <div class="detail-row">
                        <span class="detail-label">Creada:</span>
                        <span class="detail-value">${UI.formatDateTime(appointment.createdAt)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Última modificación:</span>
                        <span class="detail-value">${UI.formatDateTime(appointment.updatedAt)}</span>
                    </div>
                </div>
            `;

            UI.openModal('detailsModal');
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            UI.alert('Error al cargar los detalles de la cita');
        }
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'home.html') {
        Appointments.initHome();
    } else if (currentPage === 'appointments.html') {
        Appointments.initAppointments();
    }
});

// Exportar para uso global
window.Appointments = Appointments;