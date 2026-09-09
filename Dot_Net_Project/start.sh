#!/usr/bin/env sh
set -eu
dotnet restore DevOpsShack.ProjectOps.sln
dotnet run --project src/DevOpsShack.ProjectOps/DevOpsShack.ProjectOps.csproj
