using System.ComponentModel.DataAnnotations;

namespace ProjectOps.Api.Dtos;

public class ProjectUpsertRequest
{
    [Required, StringLength(120, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(60)]
    public string Category { get; set; } = string.Empty;

    [Required, StringLength(30)]
    public string Difficulty { get; set; } = string.Empty;

    [Required, StringLength(30)]
    public string Status { get; set; } = string.Empty;

    [Required, StringLength(80)]
    public string Owner { get; set; } = string.Empty;

    [Required, StringLength(800, MinimumLength = 5)]
    public string Description { get; set; } = string.Empty;

    [Url, StringLength(300)]
    public string? RepositoryUrl { get; set; }

    [Range(0, 100)]
    public int Progress { get; set; }
}
