[CmdletBinding()]
Param (
    [string] $siteUrl = "https://habdev.sharepoint.com/sites/SNowDemo",
    [string] $BuildNumber = "1.0.0.0",
    [switch] $uninstall,
    [switch] $skipBuild
)

#Read from package-solution.json
$packageJson = Get-Content .\config\package-solution.json | ConvertFrom-Json

# Set specific version
.\pipelines\scripts\Set-Prebuild.ps1 -BuildNumber $BuildNumber -SourcePackageName $packageJson.paths.zippedPackage

$solutionId = $packageJson.solution.id
$packageFileName = $packageJson.paths.zippedPackage.Split('/')[1]
$packageFilePath = "sharepoint/solution/$packageFileName"

Write-Host "`$siteUrl = '$siteUrl'"
Write-Host "`$solutionId = '$solutionId'"
Write-Host "`$packageFileName = '$packageFileName'"
Write-Host "`$packageFilePath = '$packageFilePath'"

if (!$skipBuild)
{    
    gulp bundle --ship
    gulp package-solution --ship
}

$installedApp = $(m365 spo app instance list --siteUrl $siteUrl --output json --query "[?ProductId == '$solutionId']") | Join-String | ConvertFrom-Json

if ($uninstall)
{
    Write-Host "Uninstalling app completely from $siteUrl..."
    m365 spo app uninstall --id $solutionId --siteUrl $siteUrl --appCatalogScope sitecollection --force
    m365 spo app retract --id $solutionId --appCatalogUrl $siteUrl --appCatalogScope sitecollection --force
    m365 spo app remove --id $solutionId --appCatalogUrl $siteUrl --appCatalogScope sitecollection --force
}

#if uninstalll stop right here, don't install it back
if ($uninstall) {return}

Write-Host "Uploading app package..."
m365 spo app add --filePath $packageFilePath --appCatalogScope sitecollection --appCatalogUrl $siteUrl --overwrite --query "ServerRelativeUrl"

Write-Host "Deploying app..."
m365 spo app deploy --name $packageFileName --appCatalogScope sitecollection --appCatalogUrl $siteUrl 

if ($installedApp)
{
    #only upgrade if app exists
    Write-Host "Upgrading app..."
    m365 spo app upgrade --id $solutionId --siteUrl $siteUrl --appCatalogScope sitecollection
}
else 
{
    Write-Host "Installing app..."
    m365 spo app install --id $solutionId --siteUrl $siteUrl --appCatalogScope sitecollection
}