using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectOps.Api.Data;

namespace ProjectOps.Api.Controllers;

[ApiController]
[Route("api")]
public class SystemController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var total = await db.Projects.CountAsync();
        var active = await db.Projects.CountAsync(p => p.Status == "Active");
        var completed = await db.Projects.CountAsync(p => p.Status == "Completed");
        var advanced = await db.Projects.CountAsync(p => p.Difficulty == "Advanced");
        var averageProgress = total == 0 ? 0 : (int)Math.Round(await db.Projects.AverageAsync(p => (double)p.Progress));

        var byStatus = await db.Projects
            .GroupBy(p => p.Status)
            .Select(g => new { name = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var byCategory = await db.Projects
            .GroupBy(p => p.Category)
            .Select(g => new { name = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ThenBy(x => x.name)
            .ToListAsync();

        return Ok(new { total, active, completed, advanced, averageProgress, byStatus, byCategory });
    }

    [HttpGet("metadata")]
    public IActionResult Metadata() => Ok(new
    {
        categories = new[] { "CI/CD", "Cloud", "DevSecOps", "Docker", "Git", "Kubernetes", "Linux", "Monitoring", "Terraform" },
        difficulties = new[] { "Beginner", "Intermediate", "Advanced" },
        statuses = new[] { "Planned", "Active", "Completed", "On Hold" }
    });
}
