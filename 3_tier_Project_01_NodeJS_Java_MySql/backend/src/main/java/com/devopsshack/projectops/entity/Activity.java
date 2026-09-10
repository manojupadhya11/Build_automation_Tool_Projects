package com.devopsshack.projectops.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activities")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(nullable = false, length = 300)
    private String message;

    private Long projectId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Activity() {}

    public Activity(String action, String message, Long projectId) {
        this.action = action;
        this.message = message;
        this.projectId = projectId;
    }

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getMessage() { return message; }
    public Long getProjectId() { return projectId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
