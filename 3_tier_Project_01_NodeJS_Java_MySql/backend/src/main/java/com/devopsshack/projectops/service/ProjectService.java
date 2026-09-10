package com.devopsshack.projectops.service;

import com.devopsshack.projectops.dto.DashboardSummary;
import com.devopsshack.projectops.dto.ProjectRequest;
import com.devopsshack.projectops.entity.*;
import com.devopsshack.projectops.exception.ResourceNotFoundException;
import com.devopsshack.projectops.repository.ActivityRepository;
import com.devopsshack.projectops.repository.ProjectRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public ProjectService(ProjectRepository projectRepository, ActivityRepository activityRepository) {
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public List<Project> getProjects(String search, ProjectStatus status, Priority priority, String environment) {
        Specification<Project> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), term),
                        cb.like(cb.lower(root.get("owner")), term),
                        cb.like(cb.lower(root.get("technology")), term),
                        cb.like(cb.lower(root.get("description")), term)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (environment != null && !environment.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("environment")), environment.toLowerCase()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return projectRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "updatedAt"));
    }

    @Transactional(readOnly = true)
    public Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project " + id + " not found"));
    }

    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = new Project();
        apply(project, request);
        Project saved = projectRepository.save(project);
        activityRepository.save(new Activity("CREATED", "Created project “" + saved.getName() + "”", saved.getId()));
        return saved;
    }

    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = getProject(id);
        apply(project, request);
        Project saved = projectRepository.save(project);
        activityRepository.save(new Activity("UPDATED", "Updated project “" + saved.getName() + "”", saved.getId()));
        return saved;
    }

    @Transactional
    public Project updateProgress(Long id, Integer progress) {
        if (progress == null || progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Progress must be between 0 and 100");
        }
        Project project = getProject(id);
        project.setProgress(progress);
        if (progress == 100) project.setStatus(ProjectStatus.COMPLETED);
        Project saved = projectRepository.save(project);
        activityRepository.save(new Activity("PROGRESS", "Progress for “" + saved.getName() + "” changed to " + progress + "%", saved.getId()));
        return saved;
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = getProject(id);
        projectRepository.delete(project);
        activityRepository.save(new Activity("DELETED", "Deleted project “" + project.getName() + "”", id));
    }

    @Transactional(readOnly = true)
    public long countProjects() {
        return projectRepository.count();
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary() {
        List<Project> projects = projectRepository.findAll();
        double average = projects.stream().mapToInt(Project::getProgress).average().orElse(0);
        return new DashboardSummary(
                projects.size(),
                projectRepository.countByStatus(ProjectStatus.ACTIVE),
                projectRepository.countByStatus(ProjectStatus.COMPLETED),
                projectRepository.countByPriority(Priority.CRITICAL),
                Math.round(average * 10.0) / 10.0
        );
    }

    @Transactional(readOnly = true)
    public List<Activity> activities(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return activityRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));
    }

    private void apply(Project project, ProjectRequest request) {
        project.setName(request.name().trim());
        project.setDescription(request.description().trim());
        project.setOwner(request.owner().trim());
        project.setTechnology(request.technology().trim());
        project.setEnvironment(request.environment().trim());
        project.setStatus(request.status());
        project.setPriority(request.priority());
        project.setProgress(request.progress());
        project.setDueDate(request.dueDate());
    }
}
