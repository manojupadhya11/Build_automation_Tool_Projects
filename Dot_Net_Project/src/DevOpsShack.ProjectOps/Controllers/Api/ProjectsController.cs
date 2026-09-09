using DevOpsShack.ProjectOps.Dtos;
using DevOpsShack.ProjectOps.Services;
using Microsoft.AspNetCore.Mvc;

namespace DevOpsShack.ProjectOps.Controllers.Api;

[ApiController]
[Route("api/projects")]
public class ProjectsController(IProjectService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? category, [FromQuery] string? difficulty)
    {
        var projects = await service.ListAsync(search, status, category, difficulty);
        return Ok(new { data = projects, meta = new { filters = new { search = search ?? "", status = status ?? "", category = category ?? "", difficulty = difficulty ?? "" } } });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var project = await service.FindAsync(id);
        return project is null ? NotFound(new { error = "Project not found." }) : Ok(new { data = project });
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProjectRequest request)
    {
        var (project, errors) = await service.CreateAsync(request);
        return errors is not null
            ? BadRequest(new { error = "Validation failed.", fields = errors })
            : StatusCode(StatusCodes.Status201Created, new { data = project });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProjectRequest request)
    {
        var (project, errors, notFound) = await service.UpdateAsync(id, request);
        if (notFound) return NotFound(new { error = "Project not found." });
        if (errors is not null) return BadRequest(new { error = "Validation failed.", fields = errors });
        return Ok(new { data = project });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await service.DeleteAsync(id) ? NoContent() : NotFound(new { error = "Project not found." });
    }
}
