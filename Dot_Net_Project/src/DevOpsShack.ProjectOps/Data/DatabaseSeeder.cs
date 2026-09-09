using DevOpsShack.ProjectOps.Models;
using Microsoft.EntityFrameworkCore;

namespace DevOpsShack.ProjectOps.Data;

public static class DatabaseSeeder
{
    public static async Task InitializeAsync(ProjectDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        if (await db.Projects.AnyAsync()) return;

        db.Projects.AddRange(
            new ProjectItem
            {
                Title = "Production CI/CD Pipeline",
                Category = "CI/CD",
                Difficulty = "Advanced",
                Status = "Active",
                Owner = "DevOps Shack",
                Description = "Build a secure CI/CD pipeline with automated testing, image build, security scanning, deployment and rollback.",
                RepositoryUrl = "https://github.com/jaiswaladi246"
            },
            new ProjectItem
            {
                Title = "Kubernetes Three-Tier App",
                Category = "Kubernetes",
                Difficulty = "Advanced",
                Status = "Planned",
                Owner = "Platform Team",
                Description = "Deploy frontend, backend and database workloads with Services, ConfigMaps, Secrets and Ingress routing.",
                RepositoryUrl = "https://github.com/jaiswaladi246"
            },
            new ProjectItem
            {
                Title = "Terraform Multi-AZ Infrastructure",
                Category = "Terraform",
                Difficulty = "Intermediate",
                Status = "Completed",
                Owner = "Cloud Team",
                Description = "Provision reusable multi-AZ networking and compute infrastructure with Terraform modules and remote state.",
                RepositoryUrl = "https://github.com/jaiswaladi246"
            },
            new ProjectItem
            {
                Title = "Container Security Pipeline",
                Category = "DevSecOps",
                Difficulty = "Intermediate",
                Status = "Active",
                Owner = "Security Team",
                Description = "Scan dependencies, container images and IaC before promoting workloads through the delivery pipeline.",
                RepositoryUrl = "https://github.com/jaiswaladi246"
            }
        );

        await db.SaveChangesAsync();
    }
}
