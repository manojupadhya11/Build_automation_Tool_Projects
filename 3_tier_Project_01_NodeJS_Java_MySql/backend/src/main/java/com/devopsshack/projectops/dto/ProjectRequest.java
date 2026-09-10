package com.devopsshack.projectops.dto;

import com.devopsshack.projectops.entity.Priority;
import com.devopsshack.projectops.entity.ProjectStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ProjectRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 1000) String description,
        @NotBlank @Size(max = 80) String owner,
        @NotBlank @Size(max = 80) String technology,
        @NotBlank @Size(max = 40) String environment,
        @NotNull ProjectStatus status,
        @NotNull Priority priority,
        @NotNull @Min(0) @Max(100) Integer progress,
        LocalDate dueDate
) {}
