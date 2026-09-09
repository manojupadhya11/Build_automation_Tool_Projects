@echo off
dotnet restore DevOpsShack.ProjectOps.sln
if errorlevel 1 exit /b 1
dotnet run --project src\DevOpsShack.ProjectOps\DevOpsShack.ProjectOps.csproj
