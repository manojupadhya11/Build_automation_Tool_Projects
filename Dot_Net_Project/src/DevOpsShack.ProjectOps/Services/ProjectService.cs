using DevOpsShack.ProjectOps.Data;
using DevOpsShack.ProjectOps.Dtos;
using DevOpsShack.ProjectOps.Models;
using Microsoft.EntityFrameworkCore;

namespace DevOpsShack.ProjectOps.Services;

public class ProjectService(ProjectDbContext db) : IProjectService
{
    public static readonly string[] Categories = ["CI/CD", "Docker", "Kubernetes", "Terraform", "Ansible", "Cloud", "DevSecOps", "Monitoring", "GitOps", "Linux", "Other"];
    public static readonly string[] Difficulties = ["Beginner", "Intermediate", "Advanced"];
    public static readonly string[] Statuses = ["Planned", "Active", "Completed", "On Hold"];

    public async Task<IReadOnlyList<ProjectResponse>> ListAsync(string? search, string? status, string? category, string? difficulty)
    {
        IQueryable<ProjectItem> query = db.Projects.AsNoTracking();
        search = Clean(search);
        status = Clean(status);
        category = Clean(category);
        difficulty = Clean(difficulty);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var token = search.ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(token) || p.Owner.ToLower().Contains(token) || p.Description.ToLower().Contains(token));
        }
        if (Statuses.Contains(status)) query = query.Where(p => p.Status == status);
        if (Categories.Contains(category)) query = query.Where(p => p.Category == category);
        if (Difficulties.Contains(difficulty)) query = query.Where(p => p.Difficulty == difficulty);

        var items = await query.OrderByDescending(p => p.UpdatedAt).ThenByDescending(p => p.Id).ToListAsync();
        return items.Select(ProjectResponse.FromEntity).ToList();
    }

    public async Task<ProjectResponse?> FindAsync(int id)
    {
        var item = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return item is null ? null : ProjectResponse.FromEntity(item);
    }

    public async Task<(ProjectResponse? Project, Dictionary<string, string>? Errors)> CreateAsync(ProjectRequest request)
    {
        var (entity, errors) = NormalizeAndValidate(request);
        if (errors.Count > 0) return (null, errors);
        db.Projects.Add(entity);
        await db.SaveChangesAsync();
        return (ProjectResponse.FromEntity(entity), null);
    }

    public async Task<(ProjectResponse? Project, Dictionary<string, string>? Errors, bool NotFound)> UpdateAsync(int id, ProjectRequest request)
    {
        var existing = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (existing is null) return (null, null, true);

        var (incoming, errors) = NormalizeAndValidate(request);
        if (errors.Count > 0) return (null, errors, false);

        existing.Title = incoming.Title;
        existing.Category = incoming.Category;
        existing.Difficulty = incoming.Difficulty;
        existing.Status = incoming.Status;
        existing.Owner = incoming.Owner;
        existing.Description = incoming.Description;
        existing.RepositoryUrl = incoming.RepositoryUrl;
        existing.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (ProjectResponse.FromEntity(existing), null, false);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (existing is null) return false;
        db.Projects.Remove(existing);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<object> StatsAsync()
    {
        var byStatus = await db.Projects.AsNoTracking().GroupBy(p => p.Status)
            .Select(g => new { status = g.Key, count = g.Count() }).OrderByDescending(x => x.count).ToListAsync();
        var byCategory = await db.Projects.AsNoTracking().GroupBy(p => p.Category)
            .Select(g => new { category = g.Key, count = g.Count() }).OrderByDescending(x => x.count).ThenBy(x => x.category).ToListAsync();

        return new
        {
            total = await db.Projects.CountAsync(),
            active = await db.Projects.CountAsync(p => p.Status == "Active"),
            completed = await db.Projects.CountAsync(p => p.Status == "Completed"),
            advanced = await db.Projects.CountAsync(p => p.Difficulty == "Advanced"),
            categories = await db.Projects.Select(p => p.Category).Distinct().CountAsync(),
            byStatus,
            byCategory
        };
    }

    private static (ProjectItem Entity, Dictionary<string, string> Errors) NormalizeAndValidate(ProjectRequest request)
    {
        var entity = new ProjectItem
        {
            Title = Clean(request.Title),
            Category = Clean(request.Category),
            Difficulty = Clean(request.Difficulty),
            Status = Clean(request.Status),
            Owner = Clean(request.Owner),
            Description = Clean(request.Description),
            RepositoryUrl = string.IsNullOrWhiteSpace(request.RepositoryUrl) ? null : request.RepositoryUrl.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var errors = new Dictionary<string, string>();
        if (entity.Title.Length is < 3 or > 120) errors["title"] = "Title must be between 3 and 120 characters.";
        if (!Categories.Contains(entity.Category)) errors["category"] = "Choose a valid category.";
        if (!Difficulties.Contains(entity.Difficulty)) errors["difficulty"] = "Choose a valid difficulty.";
        if (!Statuses.Contains(entity.Status)) errors["status"] = "Choose a valid status.";
        if (entity.Owner.Length is < 2 or > 80) errors["owner"] = "Owner must be between 2 and 80 characters.";
        if (entity.Description.Length is < 10 or > 800) errors["description"] = "Description must be between 10 and 800 characters.";
        if (entity.RepositoryUrl is not null && (!Uri.TryCreate(entity.RepositoryUrl, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            errors["repository_url"] = "Repository URL must be a valid http/https URL.";

        return (entity, errors);
    }

    private static string Clean(string? value) => value?.Trim() ?? string.Empty;
}
