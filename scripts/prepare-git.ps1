# Run as the repository owner. Does not push or deploy anything.
$ErrorActionPreference='Stop'
$projectPath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$gitSafePath=$projectPath.Replace('\','/')
Set-Location -LiteralPath $projectPath
function Invoke-ProjectGit {
  & git -c "safe.directory=$gitSafePath" @args
  if($LASTEXITCODE -ne 0) {throw "git falló: $args"}
}
if(-not (Test-Path -LiteralPath (Join-Path $projectPath '.git'))) {
  Invoke-ProjectGit init -b main
}
$branch=Invoke-ProjectGit branch --show-current
if($branch -ne 'main') {throw 'Cambiar a main antes de preparar los commits; no se renombra una rama existente.'}
& git -c "safe.directory=$gitSafePath" diff --cached --quiet
if($LASTEXITCODE -ne 0) {throw 'Hay cambios preparados en el índice. Revisarlos antes de ejecutar este script.'}
foreach($field in @('user.name','user.email')) {
  $identity=& git -c "safe.directory=$gitSafePath" config $field
  if(-not $identity) {throw "Configurar $field con la identidad del propietario antes de crear commits."}
}
$groups=@(
  @{
    Message='content: prepare 17-slide talk, Word guide and release materials'
    Files=@('.gitignore','.dockerignore','Dockerfile.deno','Dockerfile.node24','Dockerfile.node26','LICENSE','LICENSE-CONTENT.md','README.md','THIRD-PARTY.md','VALIDACION.md','abrir-presentacion.bat','iniciar-demos.bat','beerjs-legado-node.html','capture-backup.mjs','demo-specs.mjs','demos','guion-25-30-minutos.md','preguntas.md','project.config.json','package.json','package-lock.json','scripts/guide.mjs','scripts/render-guide.mjs','scripts/render-guide.ps1','scripts/build.mjs','scripts/package-check.mjs','scripts/prepare-git.ps1','assets/config.js','assets/qrcode.js','assets/qrcode-LICENSE','assets/dijkstrajs-LICENSE','assets/materiales-qr.png','assets/linkedin-qr.png','assets/skill-qr.png','test/demos.test.mjs','test/presentation.test.mjs')
  },
  @{
    Message='skill: add evidence-based read-only Node and npm audit'
    Files=@('node-security-audit','docs/SKILL-VALIDACION.md','test/fixtures','test/skill.test.mjs')
  },
  @{
    Message='live: add spectator sessions, QR and Cloudflare synchronization'
    Files=@('runner-server.mjs','sync-client.mjs','sync/worker.mjs','sync/protocol.mjs','sync/wrangler.jsonc','sync/dev.jsonc','sync/package.json','assets/live.js','assets/live.css','scripts/build-sync.mjs','scripts/browser.mjs','scripts/browser-check.mjs','scripts/sync-check.mjs','test/runner.test.mjs','test/sync.test.mjs','docs/PUBLICACION.md','.github')
  }
)
foreach($group in $groups) {
  $addArgs=@('add','--')+$group.Files
  Invoke-ProjectGit @addArgs
  & git -c "safe.directory=$gitSafePath" diff --cached --quiet
  if($LASTEXITCODE -eq 0) {continue}
  Invoke-ProjectGit diff --cached --check
  Invoke-ProjectGit commit -m $group.Message
}
$config=Get-Content -LiteralPath (Join-Path $projectPath 'project.config.json') -Raw | ConvertFrom-Json
$repoUrl=$config.repository.TrimEnd('/')
$origin=& git -c "safe.directory=$gitSafePath" remote get-url origin 2>$null
if($LASTEXITCODE -ne 0) {Invoke-ProjectGit remote add origin $config.repository}
elseif($origin.TrimEnd('/') -notin @($repoUrl,"$repoUrl.git")) {
  throw 'origin ya existe con otra URL; revisarlo manualmente. No se modificó.'
}
Invoke-ProjectGit status --short
Write-Output 'Commits preparados en main. Revisar git log y subir desde la cuenta del propietario cuando corresponda.'
