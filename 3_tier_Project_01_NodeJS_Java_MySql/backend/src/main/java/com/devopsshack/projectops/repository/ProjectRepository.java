package com.devopsshack.projectops.repository;

import com.devopsshack.projectops.entity.Priority;
import com.devopsshack.projectops.entity.Project;
import com.devopsshack.projectops.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {
    long countByStatus(ProjectStatus status);
    long countByPriority(Priority priority);
}
