param(
    [string]$registryId,
    [string]$clientId,
    [string]$subscriptionId
)

az role assignment create --assignee $clientId --scope $registryId --subscription $subscriptionId --role AcrPush