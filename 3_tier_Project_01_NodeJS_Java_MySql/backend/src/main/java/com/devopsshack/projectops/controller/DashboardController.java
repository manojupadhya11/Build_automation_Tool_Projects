package com.devopsshack.projectops.controller;

import com.devopsshack.projectops.dto.DashboardSummary;
import com.devopsshack.projectops.entity.Activity;
import com.devopsshack.projectops.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {
    private final ProjectService projectService;

    public DashboardController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummary summary() {
        return projectService.summary();
    }

    @GetMapping("/activities")
    public List<Activity> activities(@RequestParam(defaultValue = "8") int limit) {
        return projectService.activities(limit);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        long projectCount = projectService.countProjects();
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "projectops-api");
        health.put("database", "UP");
        health.put("projectCount", projectCount);
        return health;
    }
}
