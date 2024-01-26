# Overview
This repo contains instructions on how to consume ServiceNow Table API secured by Microsoft Entra from a SPFx Component running in SharePoint Online/Microsoft 365 without using an integration account or intermediate layer. The same user identity flow from SPO to ServiceNow without impersonation. This is possible because ServiceNow can be configured to be OAuth Resource using external Authorization Server (Microsoft Entra). SPFx framework already support calling WebApi secured by Microsoft Entra. That is not new and is well documented. This repo will highlight the part that trip most people off in the OAuth configuration in ServiceNow. 

# Prerequisites
- Azure CLI
- Microsoft 365 tenant
- ServiceNow Developer Instance

# Permissions
- M365 Global Administrator or Application Administrator
- ServiceNow Admin

# Microsoft Entra Setup
## Register Microsoft Entra App
Steps:
1. Open PowerShell Core > pwsh
2. Sign in to Azure by run az login
3. Run 
    ```
    .\Register-App.ps1 -appName "ServiceNow API for SPFx"
    ```
4. Inspect .env and understand it contain credential that you must protect
5. You will need this info .env in the next steps

> Important Note: accessTokenAcceptedVersion must be set to null (default to v1) since ServiceNow doesn't seem to work with v2 as of 2024-01-26 in Vancouver release.

# ServiceNow Setup
## Configure an OIDC Provider Configuration in ServiceNow
1. Navigate to https://{instance}.service-now.com/oidc_provider_configuration_list.do
2. Click New and Fill out the following fields:
    - **OIDC Provider**: Microsoft Entra OIDC v1
    - **OIDC Metadata URL**: https://login.microsoftonline.com/{tenantId}/.well-known/openid-configuration
    - **User Claim**: upn

> Important Note: OIDC Metadata URL must use the v1 endpoint. 

## Configure an OIDC Provider Configuration in ServiceNow
Steps:
1. Navigate to your ServiceNow instance https://{instance}.service-now.com/
2. Navigate to System OAuth > OAuth application
3. Click New and select "Configure an OIDC provider to verify ID tokens"
4. Fill out the following fields
- **Name**: ServiceNow API for SPFx
- **Client ID**: <Use Audience value in .env>
- **Client Secret**: <See .env>
- **OAuth OIDC Provider Configuration**: Microsoft Entra OIDC v1 <Created in previous step>
- **Comments**: This OAuth OIDC entity is created to authenticate inbound REST API calls using JWT token from external provider (Microsoft Entra)
- Under User Provisioning Tab
    - **Automatically provision users**: Checked
    - **ID Token Datasource**: Azure AD Example
    - **User roles applied to provisioned users**: user, sn_incident_read, sn_incident_write

> Important Note: Client ID must match the aud in jwt token 

## Enable CORS Rule 
Since SPFx components run in browser in the sharepoint.com domain and ServiceNow API endpoint is different domain service-now.com, by default browsers will not allow SPFx components to make REST call to other domain unless the endpoint specifically allows Cross-Origin Resource Sharing (CORS). Follow these step to configure a CORS Rules to allow call from *.sharepoint.com. Feel free adjust the domain if you don't want any wildcard subdomain of sharepoint.com to call your ServiceNow instance. 

1. Navigate to https://{instance}.service-now.com/sys_cors_rule.do
2. Click New and fill out the following fields:
 - **Name**: Allow SPO on Table APIs
 - **REST API**: Table API [now/table]
 - **Domain**: https://*.sharepoint.com
 - **HTTP Methods**: GET, POST

# Setting up local Jupyter to test out integration
You can do local Python development on Windows using VS Code. 

Install Python 3.x and set up a virtual environment in this repo:
```
python -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv/Scripts/python.exe -m pip install ipykernel -U --force-reinstall
.venv\Scripts\python.exe -m pip install -r requirements.txt
```
Once you have done this, you can open the Jupyter notebook OAuthTests.ipynb 

> Note: you should be able get data from the incident table in ServiceNow. 

# Building a demo SPFx Web Part to consume ServiceNow API

## Create a new SPFx
One has been created in this repo so you can skip this step. but if you want to start from scratch, follow the steps [here](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/build-a-hello-world-web-part)

## Build and Deploy your SPFx Web Part 

```
m365 login
$siteUrl = "https://{tenant}.sharepoint.com/sites/ServiceNowDemo"
.\Deploy-Package.ps1 -siteUrl $siteUrl
```
> Note: Add a app catalog if one doesn't exist
```
m365 spo site appcatalog add --siteUrl $siteUrl
``` 

## Add code to call ServiceNow API



# VS Code Extensions
- Jupyter
- Python extension for Visual Studio Code
