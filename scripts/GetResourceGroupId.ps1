param(
    [string]$registryName
)

az group show --name $registryName --query id --output tsv
