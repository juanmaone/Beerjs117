param(
  [Parameter(Mandatory=$true)][string]$ConverterPath,
  [Parameter(Mandatory=$true)][string]$FontDir
)
$ErrorActionPreference='Stop'
$projectPath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$artifactPath=Join-Path $projectPath 'artifacts'
$escapeXml={param($text) [System.Security.SecurityElement]::Escape($text)}
function Convert-GuideFile($source,$target,$format,$extra='') {
  $from=& $escapeXml (Join-Path $artifactPath $source)
  $to=& $escapeXml (Join-Path $artifactPath $target)
  $fonts=& $escapeXml $FontDir
  $allFonts=& $escapeXml (Join-Path $FontDir 'AllFonts.js')
  $xml="<TaskQueueDataConvert><m_sFileFrom>$from</m_sFileFrom><m_sFileTo>$to</m_sFileTo><m_nFormatTo>$format</m_nFormatTo><m_sFontDir>$fonts</m_sFontDir><m_sAllFontsPath>$allFonts</m_sAllFontsPath><m_bIsNoBase64>true</m_bIsNoBase64>$extra</TaskQueueDataConvert>"
  $taskPath=Join-Path $artifactPath 'convert-task.xml'
  Set-Content -LiteralPath $taskPath -Value $xml -Encoding utf8
  & $ConverterPath $taskPath
  if($LASTEXITCODE -ne 0) {throw "Falló el conversor: $LASTEXITCODE"}
}
Convert-GuideFile 'guia-demos.docx' 'guia-demos.pdf' 513
& node (Join-Path $PSScriptRoot 'render-guide.mjs')
if($LASTEXITCODE -ne 0) {throw 'Falló el render de PDF.js'}
Write-Output 'Render generado. Revisar todas las páginas en artifacts/guide-pages.'
