@echo off
if not exist "%~dp0beerjs-legado-node.html" (
  echo No se encontro beerjs-legado-node.html junto a este archivo.
  pause
  exit /b 1
)
rem Conservar assets junto al HTML. No necesita Python ni servidor HTTP.
start "" "%~dp0beerjs-legado-node.html"
