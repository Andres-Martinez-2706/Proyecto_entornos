/**
 * Auth - Gestión de autenticación y sesión
 */

const Auth = {
    /**
     * Guardar datos de sesión
     */
    saveSession(token, userId, email, fullName, role) {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRole', role);
    },

    /**
     * Obtener datos de sesión
     */
    getSession() {
        return {
            token: localStorage.getItem('token'),
            userId: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            fullName: localStorage.getItem('userFullName'),
            role: localStorage.getItem('userRole')
        };
    },

    /**
     * Limpiar sesión
     */
    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userRole');
    },

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    /**
     * Verificar si el usuario es administrador
     */
    isAdmin() {
        return localStorage.getItem('userRole') === 'admin';
    },

    /**
     * Redirigir según estado de autenticación
     */
    checkAuthAndRedirect() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isAuthenticated = this.isAuthenticated();

        // Si está en index.html y está autenticado, redirigir a home
        if (currentPage === 'index.html' && isAuthenticated) {
            window.location.href = 'home.html';
            return;
        }

        // Si no está en index.html y no está autenticado, redirigir a index
        if (currentPage !== 'index.html' && !isAuthenticated) {
            window.location.href = 'index.html';
            return;
        }
    },

    /**
     * Login
     */
    async login(email, password) {
        try {
            const response = await API.login(email, password);
            
            // Guardar sesión
            this.saveSession(
                response.token,
                response.userId,
                response.email,
                response.fullName,
                response.role
            );

            return { success: true, data: response };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Error al iniciar sesión' 
            };
        }
    },

    /**
     * Register
     */
    async register(fullName, email, password) {
        try {
            const response = await API.register(fullName, email, password);
            return { success: true, data: response };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Error al registrarse' 
            };
        }
    },

    /**
     * Logout
     */
    logout() {
        this.clearSession();
        window.location.href = 'index.html';
    }
};

// ==================== EVENT LISTENERS PARA INDEX.HTML ====================
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar autenticación
        Auth.checkAuthAndRedirect();

        // Elementos del DOM
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Botones para abrir modales
        const loginBtns = [
            document.getElementById('loginBtn'),
            document.getElementById('heroLoginBtn')
        ];
        const registerBtns = [
            document.getElementById('registerBtn'),
            document.getElementById('heroRegisterBtn')
        ];

        // Botones para cerrar modales
        const closeButtons = document.querySelectorAll('.modal-close');

        // Switches entre modales
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');

        // Abrir modal de login
        loginBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    loginModal.classList.add('active');
                    registerModal.classList.remove('active');
                });
            }
        });

        // Abrir modal de registro
        registerBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    registerModal.classList.add('active');
                    loginModal.classList.remove('active');
                });
            }
        });

        // Cerrar modales
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Cerrar modal al hacer clic fuera
        [loginModal, registerModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });

        // Switch entre modales
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.classList.remove('active');
                registerModal.classList.add('active');
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerModal.classList.remove('active');
                loginModal.classList.add('active');
            });
        }

        // Manejar login
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                const errorDiv = document.getElementById('loginError');
                const submitBtn = loginForm.querySelector('button[type="submit"]');

                // Limpiar errores previos
                errorDiv.textContent = '';
                submitBtn.disabled = true;
                submitBtn.textContent = 'Iniciando sesión...';

                try {
                    const result = await Auth.login(email, password);

                    if (result.success) {
                        // Redirigir a home
                        window.location.href = 'home.html';
                    } else {
                        errorDiv.textContent = result.message;
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Iniciar Sesión';
                    }
                } catch (error) {
                    errorDiv.textContent = 'Error inesperado. Inténtalo de nuevo.';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Iniciar Sesión';
                }
            });
        }

        // Manejar registro
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const fullName = document.getElementById('registerName').value.trim();
                const email = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value;
                const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
                const errorDiv = document.getElementById('registerError');
                const submitBtn = registerForm.querySelector('button[type="submit"]');

                // Limpiar errores previos
                errorDiv.textContent = '';

                // Validar contraseñas
                if (password !== passwordConfirm) {
                    errorDiv.textContent = 'Las contraseñas no coinciden';
                    return;
                }

                if (password.length < 6) {
                    errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Creando cuenta...';

                try {
                    const result = await Auth.register(fullName, email, password);

                    if (result.success) {
                        // Mostrar mensaje de éxito y cambiar a login
                        alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                        registerModal.classList.remove('active');
                        loginModal.classList.add('active');
                        registerForm.reset();
                    } else {
                        errorDiv.textContent = result.message;
                    }
                } catch (error) {
                    errorDiv.textContent = 'Error inesperado. Inténtalo de nuevo.';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Crear Cuenta';
                }
            });
        }
    });
}

// ==================== EVENT LISTENERS PARA PÁGINAS DE APP ====================
// Estas se ejecutan en todas las páginas excepto index.html
const appPages = ['home.html', 'appointments.html', 'notifications.html', 'profile.html', 'categories.html'];
const currentPage = window.location.pathname.split('/').pop();

if (appPages.includes(currentPage)) {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar autenticación
        Auth.checkAuthAndRedirect();

        // Mostrar nombre de usuario en header
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            const session = Auth.getSession();
            userNameElement.textContent = session.fullName || session.email;
        }

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de cerrar sesión?')) {
                    Auth.logout();
                }
            });
        }
    });
}

// Exportar para uso global
window.Auth = Auth;