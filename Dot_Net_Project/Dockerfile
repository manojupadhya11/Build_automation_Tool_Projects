FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore DevOpsShack.ProjectOps.sln
RUN dotnet publish src/DevOpsShack.ProjectOps/DevOpsShack.ProjectOps.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/data
ENV ASPNETCORE_URLS=http://+:8080
ENV Database__Path=/app/data/devopsshack.db
EXPOSE 8080
ENTRYPOINT ["dotnet", "DevOpsShack.ProjectOps.dll"]
