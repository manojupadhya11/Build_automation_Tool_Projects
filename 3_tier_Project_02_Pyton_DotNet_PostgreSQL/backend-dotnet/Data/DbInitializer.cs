using Microsoft.EntityFrameworkCore;
using ProjectOps.Api.Models;

namespace ProjectOps.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const int attempts = 15;
        for (var i = 1; i <= attempts; i++)
        {
            try
            {
                await db.Database.EnsureCreatedAsync();
                break;
            }
            catch when (i < attempts)
            {
                await Task.Delay(TimeSpan.FromSeconds(2));
            }
        }

        if (await db.Projects.AnyAsync()) return;

        var now = DateTime.UtcNow;
        db.Projects.AddRange(
            new Project
            {
                Title = "Production CI/CD Pipeline",
                Category = "CI/CD",
                Difficulty = "Advanced",
                Status = "Active",
                Owner = "DevOps Shack",
                Description = "Build a secure CI/CD pipeline with testing, image publishing, deployment checks and rollback.",
                RepositoryUrl = "https://github.com/jaiswaladi246",
                Progress = 72,
                CreatedAt = now,
                UpdatedAt = now
            },
            new Project
            {
                Title = "Kubernetes Three-Tier Platform",
                Category = "Kubernetes",
                Difficulty = "Advanced",
                Status = "Planned",
                Owner = "Platform Team",
                Description = "Deploy frontend, backend and database workloads with services, ingress, health checks and autoscaling.",
                Progress = 18,
                CreatedAt = now,
                UpdatedAt = now
            },
            new Project
            {
                Title = "Terraform AWS Landing Zone",
                Category = "Terraform",
                Difficulty = "Intermediate",
                Status = "Active",
                Owner = "Cloud Team",
                Description = "Provision reusable VPC, IAM, logging and baseline cloud infrastructure through Terraform modules.",
                Progress = 54,
                CreatedAt = now,
                UpdatedAt = now
            },
            new Project
            {
                Title = "Container Security Automation",
                Category = "DevSecOps",
                Difficulty = "Intermediate",
                Status = "Completed",
                Owner = "Security Team",
                Description = "Scan container images during CI and block releases that violate severity thresholds.",
                Progress = 100,
                CreatedAt = now,
                UpdatedAt = now
            }
        );

        await db.SaveChangesAsync();
    }
}
