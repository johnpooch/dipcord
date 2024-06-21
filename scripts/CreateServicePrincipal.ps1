param(
    [string]$resourceGroupId
)

az ad sp create-for-rbac --scope $resourceGroupId --role Contributor --sdk-auth