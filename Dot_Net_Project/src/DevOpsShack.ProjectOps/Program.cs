using DevOpsShack.ProjectOps.Data;
using DevOpsShack.ProjectOps.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5100);
});

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

var configuredPath = builder.Configuration["Database:Path"] ?? "data/devopsshack.db";
var dbPath = Path.IsPathRooted(configuredPath)
    ? configuredPath
    : Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, configuredPath));

Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
builder.Services.AddSingleton(new DatabasePath(dbPath));
builder.Services.AddDbContext<ProjectDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));
builder.Services.AddScoped<IProjectService, ProjectService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjectDbContext>();
    await DatabaseSeeder.InitializeAsync(db);
}

app.UseStaticFiles();
app.UseRouting();

app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

public partial class Program { }
