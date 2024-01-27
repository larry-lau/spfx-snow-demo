param(
[string] $SourcePackageName = "spfx-snow-demo.sppkg",
[string] $BuildNumber = "1.0.0.0"
)

Write-Output "Set solution version to $BuildNumber"

$json = Get-Content .\config\package-solution.json| ConvertFrom-Json
$json.solution.version = "$($BuildNumber)"
$json.paths.zippedPackage = $SourcePackageName
$json | ConvertTo-Json -Depth 99 | Out-File .\config\package-solution.json -Force -Encoding utf8

Write-Host "Setting package.json version to $BuildNumber"
$json = Get-Content .\package.json| ConvertFrom-Json
$json.version = "$($BuildNumber)"
$json | ConvertTo-Json -Depth 99 | Out-File .\package.json -Force -Encoding utf8