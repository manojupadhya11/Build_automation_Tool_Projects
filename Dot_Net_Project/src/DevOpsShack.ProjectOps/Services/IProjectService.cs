using DevOpsShack.ProjectOps.Dtos;

namespace DevOpsShack.ProjectOps.Services;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectResponse>> ListAsync(string? search, string? status, string? category, string? difficulty);
    Task<ProjectResponse?> FindAsync(int id);
    Task<(ProjectResponse? Project, Dictionary<string, string>? Errors)> CreateAsync(ProjectRequest request);
    Task<(ProjectResponse? Project, Dictionary<string, string>? Errors, bool NotFound)> UpdateAsync(int id, ProjectRequest request);
    Task<bool> DeleteAsync(int id);
    Task<object> StatsAsync();
}
