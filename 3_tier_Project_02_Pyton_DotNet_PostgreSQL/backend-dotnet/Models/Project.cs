using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectOps.Api.Models;

[Table("projects")]
public class Project
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required, MaxLength(120)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    [Column("difficulty")]
    public string Difficulty { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    [Column("status")]
    public string Status { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    [Column("owner")]
    public string Owner { get; set; } = string.Empty;

    [Required, MaxLength(800)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [MaxLength(300)]
    [Column("repository_url")]
    public string? RepositoryUrl { get; set; }

    [Range(0, 100)]
    [Column("progress")]
    public int Progress { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
