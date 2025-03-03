# Content

This folder contains 
datasource.xml - update set for OIDC ID Token data source
oidc_config_template.xml - template update set for OIDC Configuration containing the replacable tokens

# Tokens
{TenantId} is your M365 tenant where your GO Intranet deployed to
{ClientId} is the client ID of the application registration in the above tenant
{OIDCProviderName} : OIDC Provider name e.g. Microsoft Entra OIDC v1
{OIDCProviderConfigurationName} : OIDC Provider configuration e.g. ServiceNow API for GO

> Note: Don't use special character for the provider name and configuration name

# Generate the OIDC configuration update set 
Run this script and use your tenant details
```
.\Generate-OIDCConfig.ps1 -TenantId {tenantId} -ClientId {clientId}
```