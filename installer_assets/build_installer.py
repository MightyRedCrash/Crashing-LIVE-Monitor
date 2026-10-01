import os
import subprocess
import struct

def create_ico(filename):
    width, height = 32, 32
    biSize = 40
    biWidth = width
    biHeight = height * 2
    biPlanes = 1
    biBitCount = 32
    biCompression = 0
    biSizeImage = width * height * 4
    biXPelsPerMeter = 0
    biYPelsPerMeter = 0
    biClrUsed = 0
    biClrImportant = 0
    
    bmp_header = struct.pack('<IIIHHIIIIII',
        biSize, biWidth, biHeight, biPlanes, biBitCount,
        biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter,
        biClrUsed, biClrImportant
    )
    
    pixels = bytearray()
    for y in range(height):
        for x in range(width):
            dx = abs(x - 15.5)
            dy = abs(y - 15.5)
            if dx <= 14 and dy <= 14:
                if dx >= 13 or dy >= 13:
                    pixels.extend([0x66, 0xff, 0x00, 0xff]) # #00ff66
                elif 8 <= x <= 12 and 8 <= y <= 23: # 'C'
                    pixels.extend([0x00, 0x6b, 0xff, 0xff]) # #ff6b00
                elif 8 <= x <= 20 and (y == 8 or y == 23): # 'C' top/bottom
                    pixels.extend([0x00, 0x6b, 0xff, 0xff])
                elif 18 <= x <= 22 and 8 <= y <= 23: # 'L'
                    pixels.extend([0x66, 0xff, 0x00, 0xff])
                elif 18 <= x <= 25 and 8 <= y <= 11: # 'L' foot
                    pixels.extend([0x66, 0xff, 0x00, 0xff])
                else:
                    pixels.extend([0x14, 0x12, 0x10, 0xff]) # Dark BG
            else:
                pixels.extend([0, 0, 0, 0])
                
    and_mask = b'\x00' * ((width + 31) // 32 * 4 * height)
    image_data = bmp_header + bytes(pixels) + and_mask
    icondir = struct.pack('<HHH', 0, 1, 1)
    entry = struct.pack('<BBBBHHII', width, height, 0, 0, 1, 32, len(image_data), 6 + 16)
    
    with open(filename, 'wb') as f:
        f.write(icondir + entry + image_data)

def build_nsis_installer(output_path, hostname="WINSRV-PRIMARY-DC", port=8443):
    workdir = "/installer_assets"
    os.makedirs(workdir, exist_ok=True)
    ico_path = os.path.join(workdir, "app_logo.ico")
    if not os.path.exists(ico_path):
        create_ico(ico_path)

    ver_agente = os.path.join(workdir, "ver_agente.bat")
    with open(ver_agente, "w", encoding="utf-8") as f:
        f.write(f"@echo off\r\ntitle Crashing LIVE - Estado del Agente ({hostname})\r\ncd /d \"%~dp0\"\r\necho ========================================================\r\necho       CRASHING LIVE - ESTADO DEL AGENTE LOCAL\r\necho ========================================================\r\necho Nodo: {hostname} | Puerto: {port}\r\necho.\r\nsc query CrashingLiveDaemon\r\necho.\r\necho Ultimos registros de telemetria:\r\nif exist \"%~dp0logs\\agent.log\" ( type \"%~dp0logs\\agent.log\" | more ) else ( echo [i] Esperando primer ciclo de telemetria... )\r\necho.\r\npause\r\n")

    iniciar_monitor = os.path.join(workdir, "iniciar_monitor.bat")
    with open(iniciar_monitor, "w", encoding="utf-8") as f:
        f.write(f"@echo off\r\ntitle Crashing LIVE - Monitor Central\r\nstart \"\" \"http://localhost:{port}\"\r\nexit /b 0\r\n")

    daemon_py = os.path.join(workdir, "agent_daemon.py")
    with open(daemon_py, "w", encoding="utf-8") as f:
        f.write(f'''import sys, os, time, json, socket, logging, threading, psutil
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [CrashingLIVE] %(message)s", handlers=[logging.FileHandler(os.path.join(log_dir, "agent.log"), encoding="utf-8"), logging.StreamHandler(sys.stdout)])
logging.info("Crashing LIVE Daemon iniciado en {hostname}:{port}.")
while True:
    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    logging.info(f"Telemetria OK - CPU: {{cpu}}% | RAM: {{ram.percent}}%")
    time.sleep(2)
''')

    nsi_path = os.path.join(workdir, "setup.nsi")
    nsis_content = f'''!include "MUI2.nsh"

Name "Crashing LIVE Monitor & Agente"
OutFile "{output_path}"
InstallDir "$PROGRAMFILES\\Crashing LIVE"
InstallDirRegKey HKLM "Software\\CrashingLIVE" "InstallDir"
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!define MUI_ICON "{ico_path}"
!define MUI_UNICON "{ico_path}"

!define MUI_WELCOMEPAGE_TITLE "Bienvenido al Asistente de Instalación de Crashing LIVE"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalará Crashing LIVE Monitor & Agente en su equipo.\\r\\n\\r\\nPodrá elegir instalar el Agente de supervisión, el Monitor Central, o Ambos componentes con sus respectivos accesos directos en el Escritorio.\\r\\n\\r\\nHaga clic en Siguiente para continuar."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN "$INSTDIR\\iniciar_monitor.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir Crashing LIVE Monitor Web"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Abrir carpeta de instalación en el Explorador"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenInstallFolder

!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

Function OpenInstallFolder
    ExecShell "open" "$INSTDIR"
FunctionEnd

Section "Agente de Monitoreo" SecAgent
    SectionIn 1 2
    SetOutPath "$INSTDIR"
    CreateDirectory "$INSTDIR\\logs"
    CreateDirectory "$INSTDIR\\scripts"
    CreateDirectory "$INSTDIR\\backups"

    File "/oname=$INSTDIR\\app_logo.ico" "{ico_path}"
    File "/oname=$INSTDIR\\agent_daemon.py" "{daemon_py}"
    File "/oname=$INSTDIR\\ver_agente.bat" "{ver_agente}"

    ; Firewall
    ExecWait 'netsh advfirewall firewall add rule name="Crashing Live Agent Inbound" dir=in action=allow protocol=TCP localport={port}'
    ExecWait 'netsh advfirewall firewall add rule name="Crashing Live Agent Discovery" dir=in action=allow protocol=UDP localport=8444'

    ; Acceso directo EXCLUSIVO del Agente en el Escritorio
    CreateShortCut "$DESKTOP\\Crashing LIVE Agente.lnk" "$INSTDIR\\ver_agente.bat" "" "$INSTDIR\\app_logo.ico" 0
SectionEnd

Section "Monitor Central / Panel" SecMonitor
    SectionIn 1 2
    SetOutPath "$INSTDIR"
    File "/oname=$INSTDIR\\app_logo.ico" "{ico_path}"
    File "/oname=$INSTDIR\\iniciar_monitor.bat" "{iniciar_monitor}"

    ; Acceso directo EXCLUSIVO del Monitor en el Escritorio
    WriteINIStr "$DESKTOP\\Crashing LIVE Monitor.url" "InternetShortcut" "URL" "http://localhost:{port}"
    WriteINIStr "$DESKTOP\\Crashing LIVE Monitor.url" "InternetShortcut" "IconFile" "$INSTDIR\\app_logo.ico"
    WriteINIStr "$DESKTOP\\Crashing LIVE Monitor.url" "InternetShortcut" "IconIndex" "0"
SectionEnd

Section -Post
    WriteUninstaller "$INSTDIR\\uninstall.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLIVE" "DisplayName" "Crashing LIVE Monitor & Agente"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLIVE" "DisplayIcon" "$INSTDIR\\app_logo.ico"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLIVE" "UninstallString" "$INSTDIR\\uninstall.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLIVE" "InstallLocation" "$INSTDIR"
SectionEnd

Section "Uninstall"
    Delete "$DESKTOP\\Crashing LIVE Agente.lnk"
    Delete "$DESKTOP\\Crashing LIVE Monitor.url"
    ExecWait 'netsh advfirewall firewall delete rule name="Crashing Live Agent Inbound"'
    ExecWait 'netsh advfirewall firewall delete rule name="Crashing Live Agent Discovery"'
    RMDir /r "$INSTDIR"
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CrashingLIVE"
SectionEnd
'''
    with open(nsi_path, "w", encoding="utf-8") as f:
        f.write(nsis_content)

    res = subprocess.run(["makensis", nsi_path], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"makensis error: {res.stderr}")
    return output_path

if __name__ == "__main__":
    out = build_nsis_installer("/installer_assets/Instalador_CrashingLIVE.exe")
    print(f"Instalador EXE compilado exitosamente: {out}, Tamano: {os.path.getsize(out)} bytes")
