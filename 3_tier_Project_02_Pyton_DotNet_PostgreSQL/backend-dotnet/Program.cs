using Microsoft.EntityFrameworkCore;
using ProjectOps.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    status = "UP",
    service = "dotnet-backend"
}));

app.MapControllers();

await DbInitializer.InitializeAsync(app.Services);

app.Run();
