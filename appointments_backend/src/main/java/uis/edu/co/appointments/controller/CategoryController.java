package uis.edu.co.appointments.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uis.edu.co.appointments.models.Category;
import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.repository.CategoryRepository;
import uis.edu.co.appointments.service.CategoryService;

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
    @PreAuthorize("hasAuthority('admin')")
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
}
