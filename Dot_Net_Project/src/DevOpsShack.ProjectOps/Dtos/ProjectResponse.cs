using System.Text.Json.Serialization;
using DevOpsShack.ProjectOps.Models;

namespace DevOpsShack.ProjectOps.Dtos;

public class ProjectResponse
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("title")]
    public string Title { get; init; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; init; } = string.Empty;

    [JsonPropertyName("difficulty")]
    public string Difficulty { get; init; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("owner")]
    public string Owner { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; init; } = string.Empty;

    [JsonPropertyName("repository_url")]
    public string? RepositoryUrl { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; init; }

    public static ProjectResponse FromEntity(ProjectItem item) => new()
    {
        Id = item.Id,
        Title = item.Title,
        Category = item.Category,
        Difficulty = item.Difficulty,
        Status = item.Status,
        Owner = item.Owner,
        Description = item.Description,
        RepositoryUrl = item.RepositoryUrl,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt
    };
}
