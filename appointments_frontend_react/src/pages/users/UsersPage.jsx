import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Search, Shield, User as UserIcon, Briefcase, Filter, X
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import UserForm from '../../components/forms/UserForm';
import userService from '../../api/userService';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { ROLES } from '../../utils/constants';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Paginación
  const {
    page,
    size,
    totalPages,
    totalElements,
    goToPage,
    updatePagination,
  } = usePagination(0, 10);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState({
    role: '',
    active: '',
    email: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);

  // Selección
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, debouncedSearch, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Construir filtros para la búsqueda
      const searchFilters = {};
      
      if (debouncedSearch) {
        searchFilters.fullName = debouncedSearch;
        searchFilters.email = debouncedSearch;
      }
      
      if (filters.role) {
        searchFilters.role = filters.role;
      }
      
      if (filters.active !== '') {
        searchFilters.active = filters.active === 'true';
      }
      
      if (filters.email) {
        searchFilters.email = filters.email;
      }

      // Usar búsqueda avanzada si hay filtros, sino getAll
      let data;
      if (Object.keys(searchFilters).length > 0) {
        data = await userService.search(
          searchFilters,
          page,
          size,
          ['fullName', 'asc']
        );
        
        // Actualizar paginación
        updatePagination({
          totalPages: data.totalPages,
          totalElements: data.totalElements,
        });
        
        setUsers(data.content || []);
      } else {
        data = await userService.getAll();
        setUsers(data);
        updatePagination({
          totalPages: 1,
          totalElements: data.length,
        });
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      await userService.create(formData);
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    setActionLoading(true);
    try {
      await userService.update(selectedUser.id, formData);
      toast.success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Error al actualizar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    try {
      await userService.updateActiveStatus(user.id, !user.active);
      toast.success(
        user.active 
          ? 'Usuario desactivado' 
          : 'Usuario activado'
      );
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChangeRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowChangeRoleDialog(true);
  };

  const handleChangeRole = async () => {
    if (newRole === selectedUser.role) {
      toast.error('Selecciona un rol diferente');
      return;
    }

    setActionLoading(true);
    try {
      await userService.changeRole(selectedUser.id, newRole);
      toast.success('Rol actualizado exitosamente');
      setShowChangeRoleDialog(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Error al cambiar rol');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await userService.delete(selectedUser.id);
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteDialog(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    const key = role?.name || role;  
    const icons = {
      [ROLES.ADMIN]: Shield,
      [ROLES.OPERARIO]: Briefcase,
      [ROLES.USUARIO]: UserIcon,
    };
    return icons[key] || UserIcon;
  };

  const getRoleBadgeVariant = (role) => {
    const key = role?.name || role;
    const variants = {
      [ROLES.ADMIN]: 'danger',
      [ROLES.OPERARIO]: 'warning',
      [ROLES.USUARIO]: 'primary',
    };
    return variants[key] || 'default';
  };

  const getRoleLabel = (role) => {
    const key = role?.name || role;
    const labels = {
      [ROLES.ADMIN]: 'Admin',
      [ROLES.OPERARIO]: 'Operario',
      [ROLES.USUARIO]: 'Usuario',
    };
    return labels[key] || key;
  };


  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      role: '',
      active: '',
      email: '',
    });
  };

  const hasActiveFilters = () => {
    return searchTerm || filters.role || filters.active !== '' || filters.email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos los usuarios del sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre o email..."
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                onClick={clearFilters}
              >
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <Select
                label="Rol"
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                options={[
                  { value: '', label: 'Todos los roles' },
                  { value: ROLES.ADMIN, label: 'Administradores' },
                  { value: ROLES.OPERARIO, label: 'Operarios' },
                  { value: ROLES.USUARIO, label: 'Usuarios' },
                ]}
              />

              <Select
                label="Estado"
                value={filters.active}
                onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Activos' },
                  { value: 'false', label: 'Inactivos' },
                ]}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email específico
                </label>
                <input
                  type="email"
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          {!loading && (
            <div className="text-sm text-gray-600">
              {totalElements} usuario{totalElements !== 1 ? 's' : ''} encontrado{totalElements !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Usuarios */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No hay usuarios"
          description={
            hasActiveFilters()
              ? "No se encontraron usuarios con los filtros aplicados"
              : "Crea tu primer usuario"
          }
          action={
            hasActiveFilters() ? (
              <Button onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)}>
                Crear Primer Usuario
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              
              return (
                <Card key={user.id}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          user.role === ROLES.ADMIN ? 'bg-danger-100' :
                          user.role === ROLES.OPERARIO ? 'bg-warning-100' :
                          'bg-primary-100'
                        }`}>
                          <RoleIcon className={`w-5 h-5 ${
                            user.role === ROLES.ADMIN ? 'text-danger-600' :
                            user.role === ROLES.OPERARIO ? 'text-warning-600' :
                            'text-primary-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {user.fullName}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.active ? 'success' : 'default'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {/* Stats (si es operario) */}
                    {user.role === ROLES.OPERARIO && (
                      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg text-center">
                        <div>
                          <div className="text-lg font-bold text-primary-600">
                            {user.totalAppointments || 0}
                          </div>
                          <div className="text-xs text-gray-600">Citas</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-warning-600">
                            {user.averageRating?.toFixed(1) || '0.0'}
                          </div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChangeRole(user)}
                      >
                        <Shield className="w-4 h-4" />
                        Rol
                      </Button>

                      <Button
                        variant={user.active ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </>
      )}

      {/* Modal: Crear Usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal: Editar Usuario */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
        size="md"
      >
        <UserForm
          initialData={selectedUser}
          onSubmit={handleEdit}
          onCancel={() => setShowEditModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal: Cambiar Rol */}
      <Modal
        isOpen={showChangeRoleDialog}
        onClose={() => setShowChangeRoleDialog(false)}
        title={`Cambiar Rol de ${selectedUser?.fullName}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rol actual: <strong>{getRoleLabel(selectedUser?.role)}</strong>
          </p>

          <Select
            label="Nuevo Rol"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: ROLES.USUARIO, label: 'Usuario' },
              { value: ROLES.OPERARIO, label: 'Operario' },
              { value: ROLES.ADMIN, label: 'Administrador' },
            ]}
          />

          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-800">
              ⚠️ Cambiar el rol afectará los permisos y accesos del usuario
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowChangeRoleDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeRole}
              loading={actionLoading}
              disabled={newRole === selectedUser?.role}
              className="flex-1"
            >
              Cambiar Rol
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${selectedUser?.fullName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default UsersPage;