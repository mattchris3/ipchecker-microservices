FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY src/*.csproj src/
RUN dotnet restore src/IPValid.csproj
COPY src/ src/
RUN dotnet publish src/IPValid.csproj -c Release -o out
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 80
ENTRYPOINT ["dotnet", "IPValid.dll"]