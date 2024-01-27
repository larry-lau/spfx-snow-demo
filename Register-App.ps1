[CmdletBinding()]
Param (
    [string] $AppName = 'ServiceNow API for SPFx',
    [switch] $CreateClientSecret
)

$timestamp = get-date -f "yyyy-MM-dd hh:mm"
$tenantId = $(az account show --query=[tenantId] -o tsv)

Write-Host "Registering app [$AppName] in Microsoft Entra..."
$appId = $(az ad app create --display-name $AppName --required-resource-accesses resource-accesses.json --query "appId" -o tsv)
if (!$appId) { throw "Failed to register app" }

$spId = $(az ad sp show --id $appId --query=[id] -o tsv)
if (!$appId)
{
    Write-Host "Creating service principals [$AppName]..."
    az ad sp create --id $appId
} else 
{
    Write-Host "Creating service principals...Skip"
}

$identifierUri = "api://$appId"
Write-Host "Updating app identifier-uris to [$identifierUri]..."
az ad app update --id $appId --sign-in-audience AzureADMyOrg 

# Update permission scope
$apiScopeId = [guid]::NewGuid().Guid
$apiScopeJson = @{
    requestedAccessTokenVersion = $null
    oauth2PermissionScopes      = @(
        @{
            adminConsentDescription = "Access as user"
            adminConsentDisplayName = "Access as user"
            id                      = "$apiScopeId"
            isEnabled               = $true
            type                    = "User"
            userConsentDescription  = "Access as user"
            userConsentDisplayName  = "Access as user"
            value                   = "access_as_user"
        }
    )
} | ConvertTo-Json -d 4 -Compress

$apiUpdateBody = $apiScopeJson | ConvertTo-Json -d 4
Write-Host "Updating app api permission scopes..."
az ad app update --id $appId --identifier-uris $identifierUri --set api=$apiUpdateBody

# Reset client secret
if ($CreateClientSecret)
{
    Write-Host "Creating Client Secret..."
    $clientSecret = $(az ad app credential reset --id $appId --years 3 --query "password" -o tsv)
} else {
    Write-Host "Creating Client Secret...Skip"
}

Write-Host "WARNING: Writing out app details to .env which contains credentials that you must protect" -ForegroundColor Yellow
@(
    "# $PSCommandPath  run on $timestamp"
    ,"TenantId=$tenantId"
    ,"AppName=$AppName"
    ,"Audience=$identifierUri"
    ,"ClientId=$appId"
    ,"ClientSecret=$clientSecret"
) | Out-File -FilePath .\.env -Append