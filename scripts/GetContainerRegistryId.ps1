param(
    [string]$registryName
)

az acr show --name dipcord --resource-group $registryName --query id --output tsv