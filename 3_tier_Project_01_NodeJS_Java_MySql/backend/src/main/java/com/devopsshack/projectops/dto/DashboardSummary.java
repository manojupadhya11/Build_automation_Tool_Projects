package com.devopsshack.projectops.dto;

public record DashboardSummary(
        long totalProjects,
        long activeProjects,
        long completedProjects,
        long criticalProjects,
        double averageProgress
) {}
