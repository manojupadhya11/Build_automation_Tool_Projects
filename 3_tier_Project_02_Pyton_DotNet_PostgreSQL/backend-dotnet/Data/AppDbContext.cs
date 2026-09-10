using Microsoft.EntityFrameworkCore;
using ProjectOps.Api.Models;

namespace ProjectOps.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var project = modelBuilder.Entity<Project>();
        project.HasIndex(x => x.Status);
        project.HasIndex(x => x.Category);
        project.HasIndex(x => x.Difficulty);
        project.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        project.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
