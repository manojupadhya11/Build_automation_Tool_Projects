using DevOpsShack.ProjectOps.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevOpsShack.ProjectOps.Controllers;

public class HomeController(ProjectDbContext db, DatabasePath databasePath, IWebHostEnvironment environment) : Controller
{
    [HttpGet("/")]
    public IActionResult Index() => View();

    [HttpGet("/studio")]
    public async Task<IActionResult> Studio()
    {
        var projects = await db.Projects.AsNoTracking().OrderByDescending(p => p.Id).Take(100).ToListAsync();
        var root = environment.ContentRootPath;
        var displayPath = Path.GetRelativePath(root, databasePath.Value).Replace('\\', '/');
        ViewBag.DatabasePath = displayPath;
        ViewBag.RowCount = await db.Projects.CountAsync();
        return View(projects);
    }

    [HttpGet("/api-docs")]
    public IActionResult ApiDocs() => View();
}
