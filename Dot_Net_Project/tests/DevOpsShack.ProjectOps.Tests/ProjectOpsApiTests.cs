using Xunit;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace DevOpsShack.ProjectOps.Tests;

public class ProjectOpsFactory : WebApplicationFactory<Program>
{
    public string DatabaseFile { get; } = Path.Combine(Path.GetTempPath(), $"projectops-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Path"] = DatabaseFile
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (File.Exists(DatabaseFile)) File.Delete(DatabaseFile);
    }
}

public class ProjectOpsApiTests : IClassFixture<ProjectOpsFactory>
{
    private readonly HttpClient _client;

    public ProjectOpsApiTests(ProjectOpsFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsUp()
    {
        var response = await _client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("UP", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task CrudFlow_Works()
    {
        var payload = new
        {
            title = ".NET Automation Platform",
            category = "Other",
            difficulty = "Intermediate",
            status = "Planned",
            owner = "DevOps Shack",
            description = "Build and validate an automation platform using ASP.NET Core and SQLite.",
            repository_url = "https://github.com/jaiswaladi246"
        };

        var created = await _client.PostAsJsonAsync("/api/projects", payload);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id = createdBody.GetProperty("data").GetProperty("id").GetInt32();

        var fetched = await _client.GetAsync($"/api/projects/{id}");
        Assert.Equal(HttpStatusCode.OK, fetched.StatusCode);

        var updatedPayload = new
        {
            payload.title, payload.category, payload.difficulty,
            status = "Active",
            payload.owner, payload.description, payload.repository_url
        };
        var updated = await _client.PutAsJsonAsync($"/api/projects/{id}", updatedPayload);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        var deleted = await _client.DeleteAsync($"/api/projects/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/projects/{id}")).StatusCode);
    }

    [Fact]
    public async Task Validation_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/projects", new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("fields").TryGetProperty("title", out _));
    }
}
