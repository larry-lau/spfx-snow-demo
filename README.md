# Overview
This repo contains instructions on how to consume ServiceNow Table API secured by Microsoft Entra from a SPFx Component running in SharePoint Online/Microsoft 365 without using an integration account or intermediate layer. The same user identity flow from SPO to ServiceNow without impersonation. This is possible because ServiceNow can be configured to be OAuth Resource using external Authorization Server (Microsoft Entra). SPFx framework already support calling WebApi secured by Microsoft Entra. That is not new and is well documented. This repo will highlight the part that trip most people off in the OAuth configuration in ServiceNow. 

# Prerequisites
- Microsoft 365 Tenant
- ServiceNow Developer Instance
- Azure CLI
- M365 CLI

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
Since manual OIDC configuration involve many steps and it can error-prone. We offer another method using update set to complete most of the configuration steps. ServiceNow update set, is xml file containing all the configuration details and can be imported. 

## Method 1: Import update sets
Since the environment specific values are baked in the update set xml. A handy script has been prepared to swap out environment specific value such as TenantID, ClientID...etc. 

### Generate a update set xml 
Run this script to generate a update set xml specific to your M365 tenant
```
.\servicenow\Generate-OIDCConfig.ps1 -TenantId {tenantId} -ClientId {clientId}
```

Provider and configuration name can be changed and they are optional with these default values
```
$OIDCProviderName = "Microsoft Entra OIDC v1"
$OIDCProviderConfigurationName = "ServiceNow API for GO"
```

> The update set XML by the name oidc_config_{tenantId}.xml will be generated in the servicenow folder
> The update set XML does not contain secret is safe to share. 

### Import Data source
1. Navigate to https://{instance}.service-now.com/now/nav/ui/classic/params/target/sys_remote_update_set_list.do
2. Click Import Update Set from XML
3. Choose .\servicenow\datasource.xml to upload and click Upload button
4. Click on the imported update set **GO Intranet OIDC Data source**
5. Click Preview Update Set
6. Click Commit Update Set

### Import OIDC Configuration
1. Navigate to https://{instance}.service-now.com/now/nav/ui/classic/params/target/sys_remote_update_set_list.do
2. Click Import Update Set from XML
3. Choose .\servicenow\oidc_config_{tenant_id}.xml to upload and click Upload button
4. Click on the imported update set **GO Intranet OIDC Configuration**
4. Click Preview Update Set
5. Click Commit Update Set

## Method 2: Manual configuration
Follow this steps if you prefer to configure manually

### Configure an OIDC Provider Configuration in ServiceNow
1. Navigate to https://{instance}.service-now.com/oidc_provider_configuration_list.do
2. Click New and Fill out the following fields:
    - **OIDC Provider**: Microsoft Entra OIDC v1
    - **OIDC Metadata URL**: https://login.microsoftonline.com/{tenantId}/.well-known/openid-configuration
    - **User Claim**: upn
    - **Enable JTI claim verification**: unchecked

> Important Note: OIDC Metadata URL must use the v1 endpoint. 
> Entra ID does not return jti claim. Disable JTI claim verification. See https://techcommunity.microsoft.com/discussions/microsoft-entra/azure-ad-token-missing-jti-claim/2210776

### Configure an OIDC Provider Configuration in ServiceNow
Steps:
1. Navigate to your ServiceNow instance https://{instance}.service-now.com/
2. Navigate to System OAuth > Application Registies
3. Click New and select "Configure an OIDC provider to verify ID tokens"
4. Fill out the following fields
    - **Name**: ServiceNow API for SPFx
    - **Client ID**: <Use Audience value in .env>
    - **Client Secret**: <Optional>
    - **OAuth OIDC Provider Configuration**: Microsoft Entra OIDC v1 <Created in previous step>
    - **Comments**: This OAuth OIDC entity is created to authenticate inbound REST API calls using JWT token from external provider (Microsoft Entra)
    - Under User Provisioning Tab
      > Note: This is optional if your ServiceNow is already configured to import /synchronize users from Entra ID. If your ServiceNow does not have  data source suitable for OIDC ID Token, you will need to create one.
      - **Automatically provision users**: Checked
      - **ID Token Datasource**: Azure AD Example 
        - You can use a preset datasource such as Azure AD Example.
      - **User roles applied to provisioned users**: user, sn_incident_read, sn_incident_write
    
  > Create OIDC Data source: https://www.servicenow.com/docs/bundle/vancouver-integrate-applications/page/administer/import-sets/task/create-oidc-type-data-source.html

> Important Note: Client ID must match the aud in jwt token 

## Create OIDC ID Token Datasource
Consider importing a data source using .\servicenow\datasource.xml update set

1. Navigate to All > System Import Sets > Administration > Data Sources > New
2. Fill out the following fields
    - Name: Entra ID
    - Import set table label: oidc_entra_id_import
    - Import set table name: [Auto filled]
    - Type: OIDC
    - Use Batch Import: uncheck
3. Add a Transforms and Fill out the following fields
    - Name: Entra ID Transform Map    
    - Source table: oidc_entra_id_import
    - Target table: User [sys_user] 
    - Active: true
    - Run script: false    
    - Run business rules: true
    - Enforce mandatory fields: false
    - Copy empty fields: false
    - Create new record on empty coalesce fields: false
4. Create field maps
      > Note: Since the oidc_entra_id_import Table will be created on the first incoming API request, the fields doe not exist. You only be able to create the following field mapping after the table is created. 
    - upn > User ID
    - upn > Email
    - family_name > Last name
    - given_name > First name

## Enable CORS Rule 
Since SPFx components run in browser in the sharepoint.com domain and ServiceNow API endpoint is different domain service-now.com, by default browsers will not allow SPFx components to make REST call to other domain unless the endpoint specifically allows Cross-Origin Resource Sharing (CORS). Follow these step to configure a CORS Rules to allow call from *.sharepoint.com. Feel free adjust the domain if you don't want any wildcard subdomain of sharepoint.com to call your ServiceNow instance. 

1. Navigate to https://{instance}.service-now.com/sys_cors_rule_list.do
2. Click New and fill out the following fields:
    - **Name**: Allow SPO on Table APIs
    - **REST API**: Table API [now/table]
    - **Domain**: https://*.sharepoint.com
    - **HTTP Methods**: GET, POST

> Note: if you want to use other REST API, you will need to adjust accordingly. 

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
$siteUrl = "https://{tenant}.sharepoint.com/sites/SNowDemo"
.\Deploy-Package.ps1 -siteUrl $siteUrl
```
> Note: Add a app catalog if one doesn't exist
```
m365 spo site appcatalog add --siteUrl $siteUrl
``` 

## Approve permission requests
For this web part to call ServiceNow API, the permission "ServiceNow API for SPFx" must be approved by SharePoint admin first. 

```
$requests = m365 spo serviceprincipal permissionrequest list --query "[?starts_with(ResourceId, 'ServiceNow API for SPFx')]" | ConvertFrom-Json
if ($requests)
{
  $requests | % {
    Write-Host "Approving request [$($_.Resource)] [$($_.Id)]..."    
    m365 spo serviceprincipal permissionrequest approve --id $_.Id
  }
}
```
## Add code to call ServiceNow API
The code snippet below make a HTTP GET request to the service-now instance's incident Table API endpoint to fetch 5 incidents with a JWT Bearer Access Token. 
The ServiceNow instance has been configured to validate the JWT token using the External OIDC Provider previously configured with Client ID match 'api://{ClientID}'
```
public render(): void {
  const APP_ID_URL = 'api://{ClientID}}';
  const SN_INSTANCE = '{instance}.service-now.com';
  const API_ENDPOINT = `https://${SN_INSTANCE}/api/now/table/incident?sysparm_limit=5`

  this.context.aadHttpClientFactory
  .getClient(APP_ID_URL)
  .then((client: AadHttpClient): void => {
    client
    .get(API_ENDPOINT, AadHttpClient.configurations.v1)
    .then(async (response: HttpClientResponse): Promise<IncidentResponse> => {
      return response.json();
    })
    .then((json: IncidentResponse): void => {      
      ...
    }).catch((e) => {
      console.error('Failed to get aadclient.', e);
    });  
  }).catch((e) => {
    console.error('Failed to retrieve data from servicenow.', e);
  });
}
```

# VS Code Extensions
- Jupyter
- Python extension for Visual Studio Code
