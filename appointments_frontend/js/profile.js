/**
 * Profile - Gestión de perfil de usuario
 */

const Profile = {
    currentUser: null,

    /**
     * Inicializar página de perfil
     */
    async init() {
        this.setupEventListeners();
        await this.loadProfile();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón guardar preferencia de notificación
        const saveReminderBtn = document.getElementById('saveReminderBtn');
        if (saveReminderBtn) {
            saveReminderBtn.addEventListener('click', () => this.updateReminderPreference());
        }

        // Form cambiar email
        const changeEmailForm = document.getElementById('changeEmailForm');
        if (changeEmailForm) {
            changeEmailForm.addEventListener('submit', (e) => this.handleChangeEmail(e));
        }

        // Form cambiar contraseña
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }
    },

    /**
     * Cargar perfil del usuario
     */
    async loadProfile() {
        const loading = document.getElementById('profileLoading');
        const content = document.getElementById('profileContent');

        try {
            UI.showLoading('profileLoading');
            if (content) content.style.display = 'none';

            console.log('Cargando perfil...');
            this.currentUser = await API.getMyProfile();
            console.log('Perfil cargado:', this.currentUser);

            UI.hideLoading('profileLoading');
            if (content) content.style.display = 'block';

            this.displayProfile();
        } catch (error) {
            UI.hideLoading('profileLoading');
            console.error('Error al cargar perfil:', error);
            UI.alert(`Error al cargar el perfil: ${error.message}`);
        }
    },

    /**
     * Mostrar datos del perfil
     */
    displayProfile() {
        if (!this.currentUser) return;

        // Nombre completo
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = this.currentUser.fullName;
        }

        // Email
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email;
        }

        // Rol
        const profileRole = document.getElementById('profileRole');
        if (profileRole) {
            const roleName = this.currentUser.role?.name || 'Usuario';
            profileRole.textContent = roleName === 'admin' ? 'Administrador' : 'Usuario';
            
            if (roleName === 'admin') {
                profileRole.style.background = 'rgba(239, 68, 68, 0.2)';
                profileRole.style.color = '#dc2626';
            }
        }

        // Iniciales para avatar
        const userInitials = document.getElementById('userInitials');
        if (userInitials) {
            const initials = this.getInitials(this.currentUser.fullName);
            userInitials.textContent = initials;
        }

        // Fecha de registro
        const memberSince = document.getElementById('memberSince');
        if (memberSince) {
            memberSince.textContent = UI.formatDate(this.currentUser.createdAt);
        }

        // ID de usuario
        const userId = document.getElementById('userId');
        if (userId) {
            userId.textContent = this.currentUser.id;
        }

        // Preferencia de notificación
        const reminderHours = document.getElementById('reminderHours');
        if (reminderHours) {
            reminderHours.value = this.currentUser.reminderHours || 1;
        }
    },

    /**
     * Obtener iniciales del nombre
     */
    getInitials(fullName) {
        if (!fullName) return 'U';
        
        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Actualizar preferencia de recordatorio
     */
    async updateReminderPreference() {
        const reminderHours = document.getElementById('reminderHours');
        const saveBtn = document.getElementById('saveReminderBtn');
        const successDiv = document.getElementById('reminderSuccess');
        const errorDiv = document.getElementById('reminderError');

        if (!reminderHours || !this.currentUser) return;

        const hours = parseInt(reminderHours.value);

        // Validar
        if (hours < 1 || hours > 6) {
            UI.showError('reminderError', 'Las horas deben estar entre 1 y 6');
            return;
        }

        UI.clearError('reminderError');
        UI.clearSuccess('reminderSuccess');
        UI.disableButton(saveBtn, 'Guardando...');

        try {
            await API.updateNotificationPreference(this.currentUser.id, hours);
            
            // Actualizar datos locales
            this.currentUser.reminderHours = hours;
            
            UI.showSuccess('reminderSuccess', `✓ Preferencia actualizada: recordatorio ${hours} hora(s) antes`);
            
            // Ocultar mensaje después de 3 segundos
            setTimeout(() => {
                UI.clearSuccess('reminderSuccess');
            }, 3000);
        } catch (error) {
            console.error('Error al actualizar preferencia:', error);
            UI.showError('reminderError', error.message || 'Error al actualizar la preferencia');
        } finally {
            UI.enableButton(saveBtn);
        }
    },

    /**
     * Manejar cambio de email
     */
    async handleChangeEmail(e) {
        e.preventDefault();

        const form = e.target;
        const newEmail = document.getElementById('newEmail').value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');
        const successDiv = document.getElementById('emailSuccess');
        const errorDiv = document.getElementById('emailError');

        if (!this.currentUser) return;

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            UI.showError('emailError', 'Por favor ingresa un email válido');
            return;
        }

        // Verificar que no sea el mismo email
        if (newEmail === this.currentUser.email) {
            UI.showError('emailError', 'El nuevo email es igual al actual');
            return;
        }

        UI.clearError('emailError');
        UI.clearSuccess('emailSuccess');
        UI.disableButton(submitBtn, 'Actualizando...');

        try {
            await API.updateEmail(this.currentUser.id, newEmail);
            
            // Actualizar datos locales
            this.currentUser.email = newEmail;
            
            // Actualizar sesión
            const session = Auth.getSession();
            Auth.saveSession(session.token, session.userId, newEmail, session.fullName, session.role);
            
            // Actualizar display
            this.displayProfile();
            
            UI.showSuccess('emailSuccess', '✓ Email actualizado exitosamente');
            form.reset();
            
            // Ocultar mensaje después de 3 segundos
            setTimeout(() => {
                UI.clearSuccess('emailSuccess');
            }, 3000);
        } catch (error) {
            console.error('Error al actualizar email:', error);
            UI.showError('emailError', error.message || 'Error al actualizar el email');
        } finally {
            UI.enableButton(submitBtn);
        }
    },

    /**
     * Manejar cambio de contraseña
     */
    async handleChangePassword(e) {
        e.preventDefault();

        const form = e.target;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const successDiv = document.getElementById('passwordSuccess');
        const errorDiv = document.getElementById('passwordError');

        if (!this.currentUser) return;

        UI.clearError('passwordError');
        UI.clearSuccess('passwordSuccess');

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            UI.showError('passwordError', 'Las contraseñas no coinciden');
            return;
        }

        // Validar longitud mínima
        if (newPassword.length < 6) {
            UI.showError('passwordError', 'La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Validar que sea diferente a la actual
        if (currentPassword === newPassword) {
            UI.showError('passwordError', 'La nueva contraseña debe ser diferente a la actual');
            return;
        }

        UI.disableButton(submitBtn, 'Actualizando...');

        try {
            await API.updatePassword(this.currentUser.id, currentPassword, newPassword);
            
            UI.showSuccess('passwordSuccess', '✓ Contraseña actualizada exitosamente');
            form.reset();
            
            // Ocultar mensaje después de 3 segundos
            setTimeout(() => {
                UI.clearSuccess('passwordSuccess');
            }, 3000);
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            UI.showError('passwordError', error.message || 'Error al actualizar la contraseña');
        } finally {
            UI.enableButton(submitBtn);
        }
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'profile.html') {
        Profile.init();
    }
});

// Exportar para uso global
window.Profile = Profile;