# Ensure that this command is being called from the parent directory
# of the Dockerfile. This is necessary for the volume mapping to work
# correctly.


Write-Host "Running Docker container..."

# Confirm that the script is being executed from the correct directory
if (-not (Test-Path ".docker/docker-run.ps1")) {
    Write-Host "You must run this command from the parent directory of this script."
    exit
}

Write-Host "Confirmed that script is being executed from the correct directory."

# Base docker run command
$dockerCommand = "docker run"

# Add name to the container
$dockerCommand += " --name dipcord"

# Mount a volume from the host machine to the container. This means
# that the container will have access to the files in the host machine
# and that changes made in the host machine will be reflected in the
# container.
$dockerCommand += " -v .:/go/src/app:ro" # Add volume mapping

# Specify the network that the container should be connected to. This
# is necessary for the Discord bot to be able to work correctly.
$dockerCommand += " --network my-net" # Specify the network

# Specify the environment file that should be used by the container. This
# file contains secret environment variables that the application needs
# to run correctly, e.g. DISCORD_BOT_TOKEN.
$dockerCommand += " --env-file ./.env" # Specify the environment file

# Specify the image that should be used to create the container. This
$dockerCommand += " dipcord"

Write-Host "Running Docker command: $dockerCommand"

# Execute the Docker command
Invoke-Expression $dockerCommand