================================================================================
          CRASHING LIVE - GUIA DE INSTALACION Y CONEXION DEL AGENTE
================================================================================

Este agente recopila informacion de hardware en tiempo real (CPU, RAM, Discos,
Red, Uptime, Servicios) y la transmite en vivo al Monitor Central.

1. COMO INICIAR EL AGENTE EN CUALQUIER EQUIPO WINDOWS:
-------------------------------------------------------
Haga doble clic en "iniciar_agente.bat".
No requiere instalar nada adicional; funciona de forma nativa en:
- Windows 10 (Home, Pro, Enterprise)
- Windows 11 (Home, Pro, Enterprise)
- Windows Server (2016, 2019, 2022, 2025)

2. CODIGO DE AGENTE AL ESTILO ANYDESK:
--------------------------------------
Al iniciarse, el agente mostrara en pantalla su codigo exclusivo de 9 digitos:
      Ejemplo: >>> 492 810 327 <<<  (CL-492-810-327)

3. VINCULAR AL MONITOR CENTRAL:
-------------------------------
a) Abra el Monitor Central en el navegador (http://localhost:3000 o IP de red).
b) Haga clic en el boton superior "Enlace Agente ⇄ Monitor" (icono de rayo).
c) Ingrese el codigo del agente (ej. 492 810 327 o CL-492-810-327).
d) Haga clic en "Vincular y Recibir Telemetria en Vivo".

¡Listo! El equipo quedara conectado y reportando metricas en tiempo real.

4. CONECTAR UN EQUIPO REMOTO O POR RED LOCAL (LAN):
---------------------------------------------------
Si el agente esta en otra maquina de la red:
Edite "agent_config.json" y coloque en "monitor_url" la IP del monitor:
      "monitor_url": "http://192.168.1.100:3000"
O inicie por linea de comandos:
      powershell.exe -File agent_daemon.ps1 -MonitorUrl http://192.168.1.100:3000
================================================================================
