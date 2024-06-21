param(
    [string]$registryId,
    [string]$clientId
)

az role assignment create --assignee $clientId --scope $registryId --role AcrPush