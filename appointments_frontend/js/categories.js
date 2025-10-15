/**
 * Categories - Gestión de categorías (Solo Admin)
 */

const Categories = {
    currentCategories: [],

    /**
     * Inicializar página de categorías
     */
    async init() {
        // Verificar que sea admin
        if (!Auth.isAdmin()) {
            UI.alert('Esta página es solo para administradores');
            window.location.href = 'home.html';
            return;
        }

        this.setupEventListeners();
        await this.loadCategories();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón crear categoría
        const createBtn = document.getElementById('createCategoryBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Form crear/editar categoría
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleSaveCategory(e));
        }

        // Botón confirmar eliminación
        const confirmDeleteBtn = document.getElementById('confirmDeleteCategoryBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDeleteCategory());
        }
    },

    /**
     * Cargar categorías
     */
    async loadCategories() {
        const loading = document.getElementById('categoriesLoading');
        const empty = document.getElementById('categoriesEmpty');
        const grid = document.getElementById('categoriesGrid');

        try {
            UI.showLoading('categoriesLoading');
            UI.hideEmpty('categoriesEmpty');
            if (grid) grid.style.display = 'none';

            console.log('Cargando categorías...');
            this.currentCategories = await API.getCategories();
            console.log('Categorías cargadas:', this.currentCategories);

            UI.hideLoading('categoriesLoading');

            if (!this.currentCategories || this.currentCategories.length === 0) {
                UI.showEmpty('categoriesEmpty');
            } else {
                this.displayCategories();
            }
        } catch (error) {
            UI.hideLoading('categoriesLoading');
            console.error('Error al cargar categorías:', error);
            UI.alert(`Error al cargar las categorías: ${error.message}`);
        }
    },

    /**
     * Mostrar categorías
     */
    displayCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        grid.innerHTML = this.currentCategories
            .map(category => this.createCategoryCard(category))
            .join('');
        
        grid.style.display = 'grid';
    },

    /**
     * Crear card de categoría
     */
    createCategoryCard(category) {
        const hasDescription = category.description && category.description.trim();
        
        return `
            <div class="category-card" data-id="${category.id}">
                <div class="category-header">
                    <div class="category-icon">📁</div>
                    <h3 class="category-name">${UI.escapeHtml(category.name)}</h3>
                </div>
                
                ${hasDescription ? `
                    <p class="category-description">${UI.escapeHtml(category.description)}</p>
                ` : `
                    <p class="category-description" style="color: var(--text-tertiary); font-style: italic;">
                        Sin descripción
                    </p>
                `}
                
                <div class="category-actions">
                    <button class="btn btn-sm btn-outline" onclick="Categories.viewDetails(${category.id})">
                        👁️ Ver detalles
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="Categories.showEditModal(${category.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Categories.showDeleteModal(${category.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Mostrar modal de creación
     */
    showCreateModal() {
        const modal = document.getElementById('categoryModal');
        const modalTitle = document.getElementById('categoryModalTitle');
        const form = document.getElementById('categoryForm');

        if (!modal || !form) return;

        // Limpiar formulario
        form.reset();
        document.getElementById('categoryId').value = '';
        modalTitle.textContent = 'Nueva Categoría';
        UI.clearError('categoryError');

        UI.openModal('categoryModal');
    },

    /**
     * Mostrar modal de edición
     */
    async showEditModal(categoryId) {
        try {
            const category = await API.getCategoryById(categoryId);

            if (!category) {
                UI.alert('Categoría no encontrada');
                return;
            }

            const modalTitle = document.getElementById('categoryModalTitle');
            modalTitle.textContent = 'Editar Categoría';

            // Llenar formulario
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryDescription').value = category.description || '';

            UI.clearError('categoryError');
            UI.openModal('categoryModal');
        } catch (error) {
            console.error('Error al cargar categoría:', error);
            UI.alert(`Error al cargar los datos de la categoría: ${error.message}`);
        }
    },

    /**
     * Guardar categoría (crear o editar)
     */
    async handleSaveCategory(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const categoryId = document.getElementById('categoryId').value;
        const isEdit = !!categoryId;

        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim() || null
        };

        // Validar nombre
        if (!categoryData.name) {
            UI.showError('categoryError', 'El nombre es obligatorio');
            return;
        }

        UI.clearError('categoryError');
        UI.disableButton(submitBtn, 'Guardando...');

        try {
            if (isEdit) {
                categoryData.id = parseInt(categoryId);
                await API.updateCategory(categoryId, categoryData);
                UI.alert('Categoría actualizada exitosamente');
            } else {
                await API.createCategory(categoryData);
                UI.alert('Categoría creada exitosamente');
            }

            UI.closeModal('categoryModal');
            
            // Recargar categorías
            await this.loadCategories();
            
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            UI.showError('categoryError', error.message || 'Error al guardar la categoría');
        } finally {
            UI.enableButton(submitBtn);
        }
    },

    /**
     * Mostrar modal de confirmación de eliminación
     */
    showDeleteModal(categoryId) {
        const category = this.currentCategories.find(c => c.id === categoryId);
        
        if (!category) {
            UI.alert('Categoría no encontrada');
            return;
        }

        document.getElementById('deleteCategoryId').value = categoryId;
        
        const deleteMessage = document.getElementById('deleteCategoryMessage');
        deleteMessage.textContent = `¿Estás seguro de eliminar la categoría "${category.name}"?`;

        UI.clearError('deleteCategoryError');
        UI.openModal('deleteCategoryModal');
    },

    /**
     * Eliminar categoría
     */
    async handleDeleteCategory() {
        const categoryId = document.getElementById('deleteCategoryId').value;
        const confirmBtn = document.getElementById('confirmDeleteCategoryBtn');

        UI.clearError('deleteCategoryError');
        UI.disableButton(confirmBtn, 'Eliminando...');

        try {
            await API.deleteCategory(categoryId);
            UI.closeModal('deleteCategoryModal');
            UI.alert('Categoría eliminada exitosamente');
            
            // Recargar categorías
            await this.loadCategories();
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            
            // Error específico si la categoría está en uso
            if (error.message.includes('uso') || error.message.includes('constraint')) {
                UI.showError('deleteCategoryError', 
                    'No se puede eliminar esta categoría porque está siendo usada por citas existentes');
            } else {
                UI.showError('deleteCategoryError', error.message || 'Error al eliminar la categoría');
            }
        } finally {
            UI.enableButton(confirmBtn);
        }
    },

    /**
     * Ver detalles de categoría
     */
    async viewDetails(categoryId) {
        try {
            const category = await API.getCategoryById(categoryId);

            if (!category) {
                UI.alert('Categoría no encontrada');
                return;
            }

            // Obtener todas las citas para contar las de esta categoría
            let appointmentsCount = 0;
            try {
                const allAppointments = await API.getAppointments(false); // Solo activas
                appointmentsCount = allAppointments.filter(apt => 
                    apt.category && apt.category.id === categoryId
                ).length;
            } catch (error) {
                console.error('Error al contar citas:', error);
            }

            const content = document.getElementById('categoryDetailsContent');
            if (!content) return;

            const hasDescription = category.description && category.description.trim();

            content.innerHTML = `
                <div class="detail-section">
                    <div class="detail-row">
                        <span class="detail-label">ID:</span>
                        <span class="detail-value">${category.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nombre:</span>
                        <span class="detail-value">${UI.escapeHtml(category.name)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Descripción:</span>
                        <span class="detail-value">
                            ${hasDescription ? UI.escapeHtml(category.description) : 
                              '<em style="color: var(--text-tertiary);">Sin descripción</em>'}
                        </span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Uso de la Categoría</div>
                    <div class="detail-row">
                        <span class="detail-label">Citas activas:</span>
                        <span class="detail-value">
                            <strong style="font-size: 1.2rem; color: var(--primary);">${appointmentsCount}</strong>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="badge" style="background: var(--success); color: white;">
                                ✓ Activa
                            </span>
                        </span>
                    </div>
                    ${appointmentsCount > 0 ? `
                        <div class="info-note" style="margin-top: var(--spacing-md);">
                            ⚠️ Esta categoría está siendo usada por <strong>${appointmentsCount}</strong> cita(s) activa(s) 
                            y no podrá eliminarse hasta que no tenga citas asociadas.
                        </div>
                    ` : ''}
                </div>
            `;

            UI.openModal('categoryDetailsModal');
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            UI.alert('Error al cargar los detalles de la categoría');
        }
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'categories.html') {
        Categories.init();
    }
});

// Exportar para uso global
window.Categories = Categories;