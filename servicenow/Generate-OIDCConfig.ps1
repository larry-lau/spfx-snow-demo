[CmdletBinding()]
Param (
    [Parameter(Mandatory=$true)]
    [string] $TenantId = "542756b4-b831-4e92-a2b0-aafa8da24b26",
    [Parameter(Mandatory=$true)]
    [string] $ClientId = "774240b8-bab7-4a77-9da4-788cb7c60ab4",
    [string] $OIDCProviderName = "Microsoft Entra OIDC v1",
    [string] $OIDCProviderConfigurationName = "ServiceNow API for GO"
)
$fileId = $TenantId.Split("-")[0]
$oidcFileName = "$PSScriptRoot\go_oidc_config_$fileId.xml"
$template = Get-Content "$PSScriptRoot\oidc_config_template.xml"
$oidcConfig = $template -replace "{TenantId}", $TenantId `
    -replace "{ClientId}", $ClientId `
    -replace "{OIDCProviderName}", $OIDCProviderName `
    -replace "{OIDCProviderConfigurationName}", $OIDCProviderConfigurationName 
$oidcConfig | Set-Content $oidcFileName

