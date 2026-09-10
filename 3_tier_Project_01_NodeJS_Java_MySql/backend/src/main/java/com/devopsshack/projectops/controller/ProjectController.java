package com.devopsshack.projectops.controller;

import com.devopsshack.projectops.dto.ProjectRequest;
import com.devopsshack.projectops.entity.Priority;
import com.devopsshack.projectops.entity.Project;
import com.devopsshack.projectops.entity.ProjectStatus;
import com.devopsshack.projectops.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<Project> getProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String environment) {
        return projectService.getProjects(search, status, priority, environment);
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable Long id) {
        return projectService.getProject(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project createProject(@Valid @RequestBody ProjectRequest request) {
        return projectService.createProject(request);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.updateProject(id, request);
    }

    @PatchMapping("/{id}/progress")
    public Project updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return projectService.updateProgress(id, body.get("progress"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
