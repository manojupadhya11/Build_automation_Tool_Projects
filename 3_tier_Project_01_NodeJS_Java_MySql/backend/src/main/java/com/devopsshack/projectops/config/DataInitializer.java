package com.devopsshack.projectops.config;

import com.devopsshack.projectops.entity.*;
import com.devopsshack.projectops.repository.ActivityRepository;
import com.devopsshack.projectops.repository.ProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seed(ProjectRepository projects, ActivityRepository activities) {
        return args -> {
            if (projects.count() > 0) return;

            Project p1 = project("Production CI/CD Platform", "Secure pipeline with quality gates, image scanning and rollback automation.", "Platform Team", "Spring Boot + Jenkins", "Production", ProjectStatus.ACTIVE, Priority.CRITICAL, 78, 12);
            Project p2 = project("Kubernetes Migration", "Move customer-facing workloads to a resilient Kubernetes platform.", "Cloud Team", "Kubernetes + Argo CD", "Staging", ProjectStatus.ACTIVE, Priority.HIGH, 64, 25);
            Project p3 = project("Observability Stack", "Centralized metrics, logs and alerting with SLO-focused dashboards.", "SRE Team", "Prometheus + Grafana", "Production", ProjectStatus.COMPLETED, Priority.MEDIUM, 100, -4);
            Project p4 = project("Terraform Landing Zone", "Reusable IaC modules for VPC, IAM, logging and account baselines.", "Cloud Team", "Terraform + AWS", "Development", ProjectStatus.PLANNING, Priority.HIGH, 22, 40);
            Project p5 = project("Secrets Rotation", "Automated application secret rotation with short-lived credentials.", "Security Team", "Vault + Spring", "QA", ProjectStatus.ON_HOLD, Priority.CRITICAL, 48, 18);

            List<Project> saved = projects.saveAll(List.of(p1, p2, p3, p4, p5));
            activities.saveAll(saved.stream()
                    .map(p -> new Activity("CREATED", "Seeded project “" + p.getName() + "”", p.getId()))
                    .toList());
        };
    }

    private Project project(String name, String description, String owner, String technology, String environment,
                            ProjectStatus status, Priority priority, int progress, int dueOffsetDays) {
        Project p = new Project();
        p.setName(name);
        p.setDescription(description);
        p.setOwner(owner);
        p.setTechnology(technology);
        p.setEnvironment(environment);
        p.setStatus(status);
        p.setPriority(priority);
        p.setProgress(progress);
        p.setDueDate(LocalDate.now().plusDays(dueOffsetDays));
        return p;
    }
}
