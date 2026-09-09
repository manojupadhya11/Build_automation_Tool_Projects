using DevOpsShack.ProjectOps.Models;
using Microsoft.EntityFrameworkCore;

namespace DevOpsShack.ProjectOps.Data;

public class ProjectDbContext(DbContextOptions<ProjectDbContext> options) : DbContext(options)
{
    public DbSet<ProjectItem> Projects => Set<ProjectItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ProjectItem>();
        entity.HasIndex(p => p.Status).HasDatabaseName("idx_projects_status");
        entity.HasIndex(p => p.Category).HasDatabaseName("idx_projects_category");
        entity.HasIndex(p => p.Difficulty).HasDatabaseName("idx_projects_difficulty");
        entity.Property(p => p.Title).IsRequired().HasMaxLength(120);
        entity.Property(p => p.Owner).IsRequired().HasMaxLength(80);
        entity.Property(p => p.Description).IsRequired().HasMaxLength(800);
    }
}
