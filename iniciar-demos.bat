@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo No se encontro Docker. Instala Docker Desktop antes de ejecutar las demos.
  goto :failure
)
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Se necesita Node 24 LTS.
  goto :failure
)

echo Comprobando el motor Docker...
docker info >nul 2>nul
if errorlevel 1 (
  echo El motor Docker no esta disponible.
  echo Abri Docker Desktop, espera a que indique Engine running y ejecuta este archivo otra vez.
  echo Docker debe estar en modo contenedores Linux.
  goto :failure
)

echo Preparando Node 24 y npm 11...
docker build -f Dockerfile.node24 -t beerjs-node24:local .
if errorlevel 1 goto :failure
echo Preparando Node 26 y npm 12...
docker build -f Dockerfile.node26 -t beerjs-node26:local .
if errorlevel 1 goto :failure
echo Preparando Deno...
docker build -f Dockerfile.deno -t beerjs-deno:local .
if errorlevel 1 goto :failure

echo.
echo Iniciando runner. Deja esta ventana abierta durante la presentacion.
echo En el HTML, pulsa Conectar runner.
node runner-server.mjs
if errorlevel 1 goto :failure
exit /b 0

:failure
echo.
echo No se iniciaron las demos. Revisa el error anterior.
pause
exit /b 1
