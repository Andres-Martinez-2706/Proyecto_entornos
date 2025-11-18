package uis.edu.co.appointments.models;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Type;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "categories")
@Getter
@Setter
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la categoría no puede estar vacío")
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    private String description;

    @Type(JsonType.class)
    @Column(name = "allowed_durations", columnDefinition = "jsonb")
    @JsonProperty("allowedDurations")
    private List<Integer> allowedDurations = new ArrayList<>();

    @ManyToMany(mappedBy = "operatorCategories")
    @JsonIgnoreProperties({"operatorCategories"})
    private List<User> operators = new ArrayList<>();
}
