package uis.edu.co.appointments.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import uis.edu.co.appointments.models.Category;
import uis.edu.co.appointments.repository.CategoryRepository;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.UserRepository;
import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository,
                          UserRepository userRepository) { // NUEVO
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository; // NUEVO
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    /**
     * Agregar duración permitida a una categoría
     */
    @Transactional
    public void addAllowedDuration(Long categoryId, Integer durationMinutes) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        if (durationMinutes == null || durationMinutes <= 0) {
            throw new IllegalArgumentException("La duración debe ser positiva");
        }

        List<Integer> durations = category.getAllowedDurations();
        if (durations == null) {
            durations = new ArrayList<>();
        }

        if (!durations.contains(durationMinutes)) {
            durations.add(durationMinutes);
            category.setAllowedDurations(durations);
            categoryRepository.save(category);
        }
    }

    /**
     * Remover duración permitida
     */
    @Transactional
    public void removeAllowedDuration(Long categoryId, Integer durationMinutes) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        List<Integer> durations = category.getAllowedDurations();
        if (durations != null) {
            durations.remove(durationMinutes);
            category.setAllowedDurations(durations);
            categoryRepository.save(category);
        }
    }

    /**
     * Obtener duraciones permitidas
     */
    public List<Integer> getAllowedDurations(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        
        return category.getAllowedDurations() != null 
            ? category.getAllowedDurations() 
            : new ArrayList<>();
    }

    /**
     * Actualizar duraciones permitidas (reemplazar todas)
     */
    @Transactional
    public void updateAllowedDurations(Long categoryId, List<Integer> durations) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        // Validar duraciones
        if (durations == null || durations.isEmpty()) {
            throw new IllegalArgumentException("Debe proporcionar al menos una duración");
        }

        for (Integer duration : durations) {
            if (duration == null || duration <= 0) {
                throw new IllegalArgumentException("Todas las duraciones deben ser positivas");
            }
        }

        category.setAllowedDurations(durations);
        categoryRepository.save(category);
    }

    /**
     * Asignar operarios a una categoría
     */
    @Transactional
    public void assignOperators(Long categoryId, List<Long> operatorIds) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        // Obtener operarios
        List<User> operators = userRepository.findAllById(operatorIds);
        
        if (operators.size() != operatorIds.size()) {
            throw new IllegalArgumentException("Algunos operarios no existen");
        }

        // Verificar que todos sean operarios
        for (User user : operators) {
            if (!"OPERARIO".equalsIgnoreCase(user.getRole().getName())) {
                throw new IllegalArgumentException(
                    "El usuario " + user.getFullName() + " no es un operario"
                );
            }
        }

        // Actualizar la lista de operarios en cada operario (relación bidireccional)
        for (User operator : operators) {
            if (!operator.getOperatorCategories().contains(category)) {
                operator.getOperatorCategories().add(category);
            }
        }

        categoryRepository.save(category);
        userRepository.saveAll(operators);
    }

    /**
     * Obtener operarios de una categoría
     */
    public List<User> getOperatorsByCategory(Long categoryId) {
        return userRepository.findActiveOperatorsByCategory(categoryId);
    }
}
