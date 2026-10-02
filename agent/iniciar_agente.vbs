' Crashing LIVE - Lanzador Invisible del Agente Windows
' Ejecuta el proceso en segundo plano sin ventana negra de consola (SW_HIDE = 0)
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
ps1Script = scriptDir & "\agent_daemon.ps1"

' Lanzar powershell con ventana 100% oculta
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1Script & """"
WshShell.Run cmd, 0, False
Set WshShell = Nothing
Set FSO = Nothing
