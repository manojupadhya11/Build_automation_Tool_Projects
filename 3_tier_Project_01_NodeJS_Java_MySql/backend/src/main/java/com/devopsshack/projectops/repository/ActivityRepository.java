package com.devopsshack.projectops.repository;

import com.devopsshack.projectops.entity.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
