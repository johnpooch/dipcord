# Run npm build
Write-Host "Running npm build..."
npm run build

# Check if npm build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "npm build completed successfully. Restarting dipcord-application..."
    docker-compose restart dipcord-application
} else {
    Write-Host "npm build failed. Not restarting dipcord-application."
}