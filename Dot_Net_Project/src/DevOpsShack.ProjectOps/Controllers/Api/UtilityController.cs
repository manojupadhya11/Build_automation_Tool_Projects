using DevOpsShack.ProjectOps.Services;
using Microsoft.AspNetCore.Mvc;

namespace DevOpsShack.ProjectOps.Controllers.Api;

[ApiController]
public class UtilityController(IProjectService service) : ControllerBase
{
    [HttpGet("/api/stats")]
    public async Task<IActionResult> Stats() => Ok(new { data = await service.StatsAsync() });

    [HttpGet("/api/metadata")]
    public IActionResult Metadata() => Ok(new
    {
        data = new
        {
            categories = ProjectService.Categories,
            difficulties = ProjectService.Difficulties,
            statuses = ProjectService.Statuses
        }
    });

    [HttpGet("/health")]
    public IActionResult Health() => Ok(new
    {
        status = "UP",
        service = "ProjectOps Studio - .NET",
        runtime = ".NET 8 + ASP.NET Core"
    });
}
