@echo off
cd /d "%~dp0"
:: Lanzamiento desatendido / sin consola mediante WScript VBScript invisible
start "" wscript.exe "%~dp0iniciar_agente.vbs"
exit /b 0
