using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectOps.Api.Data;
using ProjectOps.Api.Dtos;
using ProjectOps.Api.Models;

namespace ProjectOps.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    private static readonly string[] Categories =
    ["CI/CD", "Cloud", "DevSecOps", "Docker", "Git", "Kubernetes", "Linux", "Monitoring", "Terraform"];

    private static readonly string[] Difficulties = ["Beginner", "Intermediate", "Advanced"];
    private static readonly string[] Statuses = ["Planned", "Active", "Completed", "On Hold"];

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] string? difficulty)
    {
        IQueryable<Project> query = db.Projects.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p =>
                EF.Functions.ILike(p.Title, $"%{term}%") ||
                EF.Functions.ILike(p.Owner, $"%{term}%") ||
                EF.Functions.ILike(p.Category, $"%{term}%") ||
                EF.Functions.ILike(p.Description, $"%{term}%"));
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);
        if (!string.IsNullOrWhiteSpace(difficulty))
            query = query.Where(p => p.Difficulty == difficulty);

        return Ok(await query.OrderByDescending(p => p.UpdatedAt).ThenByDescending(p => p.Id).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Project>> GetOne(int id)
    {
        var project = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return NotFound(new { message = "Project not found" });
        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> Create(ProjectUpsertRequest request)
    {
        var validationError = ValidateAllowedValues(request);
        if (validationError is not null) return BadRequest(new { message = validationError });

        var project = new Project();
        Apply(project, request);
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = project.CreatedAt;

        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = project.Id }, project);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Project>> Update(int id, ProjectUpsertRequest request)
    {
        var validationError = ValidateAllowedValues(request);
        if (validationError is not null) return BadRequest(new { message = validationError });

        var project = await db.Projects.FindAsync(id);
        if (project is null) return NotFound(new { message = "Project not found" });

        Apply(project, request);
        project.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(project);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project is null) return NotFound(new { message = "Project not found" });

        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string? ValidateAllowedValues(ProjectUpsertRequest request)
    {
        if (!Categories.Contains(request.Category)) return $"Unsupported category: {request.Category}";
        if (!Difficulties.Contains(request.Difficulty)) return $"Unsupported difficulty: {request.Difficulty}";
        if (!Statuses.Contains(request.Status)) return $"Unsupported status: {request.Status}";
        return null;
    }

    private static void Apply(Project project, ProjectUpsertRequest request)
    {
        project.Title = request.Title.Trim();
        project.Category = request.Category;
        project.Difficulty = request.Difficulty;
        project.Status = request.Status;
        project.Owner = request.Owner.Trim();
        project.Description = request.Description.Trim();
        project.RepositoryUrl = string.IsNullOrWhiteSpace(request.RepositoryUrl) ? null : request.RepositoryUrl.Trim();
        project.Progress = request.Progress;
    }
}
