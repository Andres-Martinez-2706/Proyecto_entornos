package uis.edu.co.appointments.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uis.edu.co.appointments.models.Category;
import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.repository.CategoryRepository;
import uis.edu.co.appointments.service.CategoryService;
import uis.edu.co.appointments.dto.UpdateDurationsRequest;
import uis.edu.co.appointments.dto.AssignCategoriesRequest;
import uis.edu.co.appointments.models.User;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryService categoryService, CategoryRepository categoryRepository) {
        this.categoryService = categoryService;
        this.categoryRepository = categoryRepository;
    }


    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Category> getCategoryById(@PathVariable Long id) {
        return categoryService.findById(id);
    }

    @PostMapping
    public Category createCategory(@RequestBody Category category) {
        return categoryService.save(category);
    }

    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category category) {
        category.setId(id);
        return categoryService.save(category);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            // Verificar si la categoría está en uso
            long appointmentsCount = categoryRepository.countAppointmentsByCategoryId(id);
            
            if (appointmentsCount > 0) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                        "No se puede eliminar esta categoría porque está siendo usada por " + 
                        appointmentsCount + " cita(s)"
                    ));
            }
            
            categoryRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Categoría eliminada exitosamente"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al eliminar categoría: " + e.getMessage()));
        }
    }
    /**
     * Actualizar duraciones permitidas de una categoría
     */
    @PatchMapping("/{id}/durations")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateAllowedDurations(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDurationsRequest request) {
        
        try {
            categoryService.updateAllowedDurations(id, request.getAllowedDurations());
            
            return ResponseEntity.ok(
                ApiResponse.success("Duraciones actualizadas exitosamente")
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Obtener duraciones permitidas de una categoría
     */
    @GetMapping("/{id}/durations")
    public ResponseEntity<List<Integer>> getAllowedDurations(@PathVariable Long id) {
        List<Integer> durations = categoryService.getAllowedDurations(id);
        return ResponseEntity.ok(durations);
    }

    /**
     * Asignar operarios a una categoría
     */
    @PatchMapping("/{id}/operators")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> assignOperators(
            @PathVariable Long id,
            @Valid @RequestBody AssignCategoriesRequest request) {
        
        try {
            // Reutilizamos AssignCategoriesRequest pero aquí son operatorIds
            categoryService.assignOperators(id, request.getCategoryIds());
            
            return ResponseEntity.ok(
                ApiResponse.success("Operarios asignados exitosamente")
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Obtener operarios de una categoría
     */
    @GetMapping("/{id}/operators")
    public ResponseEntity<List<User>> getCategoryOperators(@PathVariable Long id) {
        List<User> operators = categoryService.getOperatorsByCategory(id);
        return ResponseEntity.ok(operators);
    }
}
