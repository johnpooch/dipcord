param(
    [string]$resourceGroupId
)

az ad sp create-for-rbac --name dipcordServicePrincipal --scope $resourceGroupId --role Contributor --sdk-auth