package uis.edu.co.appointments.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public class AssignCategoriesRequest {
    
    @NotEmpty(message = "Debe proporcionar al menos una categoría")
    private List<Long> categoryIds;

    public List<Long> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<Long> categoryIds) { 
        this.categoryIds = categoryIds; 
    }
}