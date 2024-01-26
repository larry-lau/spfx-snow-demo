# Overview
This repo contains instructions on how to consume ServiceNow Table API secured by Microsoft Entra from a SPFx Component running in SharePoint Online/Microsoft 365 without using an integration account or intermediate layer. The same user identity flow from SPO to ServiceNow without impersonation. This is possible because ServiceNow can be configured to be OAuth Resource using external Authorization Server (Microsoft Entra). SPFx framework already support calling WebApi secured by Microsoft Entra. That is not new and is well documented. This repo will highligh the part that trip most people off in the OAuth configuration in ServiceNow. 

# Prerequisites
- Azure CLI
- Microsoft 365 tenant
- ServiceNow Developer Instance

# Permissions
- M365 Global Administrator or Application Administrator
- ServiceNow Admin

Steps:
1. Open PowerShell Core > pwsh
2. Sign in to Azure by run az login
3. Run .\Register-App.ps1 -appName "ServiceNow API for SPFx"
4. Inspect .env and keep it safe
5. You will need this info in the next step

Note:
accessTokenAcceptedVersion is set to 2 when registering app using CLI
accessTokenAcceptedVersion is set to null if register via Azure Portal. 