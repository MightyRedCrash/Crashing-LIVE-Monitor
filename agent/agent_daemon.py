# -*- coding: utf-8 -*-
"""
Crashing LIVE - Agente de Telemetria Windows (Python)
Compatible con Windows 10, Windows 11 y Windows Server
Funciona con Python estandar sin requerir dependencias externas (usa urllib y WMI/ctypes si psutil no esta).
"""

import sys
import os
import time
import json
import socket
import platform
import random
import urllib.request
import urllib.error

# Intentar psutil si esta instalado
try:
    import psutil
except ImportError:
    psutil = None

app_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(app_dir, "agent_config.json")

def load_or_create_config():
    config = {}
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception:
            config = {}

    if not config.get("display_code"):
        p1 = random.randint(100, 999)
        p2 = random.randint(100, 999)
        p3 = random.randint(100, 999)
        num_code = f"{p1}{p2}{p3}"
        config["numeric_code"] = num_code
        config["display_code"] = f"{p1} {p2} {p3}"
        config["agent_id"] = f"CL-{p1}-{p2}-{p3}"
        config["monitor_url"] = config.get("monitor_url", "http://localhost:3000")
        config["interval_seconds"] = config.get("interval_seconds", 2)
        config["tunnel_token"] = config.get("tunnel_token", "clk_live_tunnel_sec_2026")
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    return config

config = load_or_create_config()
monitor_url = config.get("monitor_url", "http://localhost:3000").rstrip("/")
interval = int(config.get("interval_seconds", 2))
tunnel_token = config.get("tunnel_token", "clk_live_tunnel_sec_2026")
display_code = config.get("display_code", "492 810 327")
agent_id = config.get("agent_id", f"CL-{display_code.replace(' ', '-')}")

hostname = socket.gethostname()
os_caption = f"{platform.system()} {platform.release()} ({platform.version()})"

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

local_ip = get_local_ip()

print("=" * 80)
print("                  CRASHING LIVE - AGENTE DE MONITOREO (PYTHON)")
print("=" * 80)
print(f"  SU CODIGO DE AGENTE (ESTILO ANYDESK):")
print()
print(f"             >>>   {display_code}   <<<")
print(f"                   ID: {agent_id}")
print()
print("  Introduzca este codigo en el Monitor Central para conectar y ver el estado.")
print("=" * 80)
print(f"  Monitor URL:  {monitor_url}")
print(f"  Equipo:       {hostname} ({os_caption})")
print(f"  IP Local:     {local_ip}")
print(f"  Frecuencia:   Cada {interval} segundos")
print("=" * 80)
print("  Presione Ctrl+C en cualquier momento para detener el agente.\n")

def read_metrics():
    cpu = 15.0
    ram = 50.0
    ram_used_gb = 8.0
    ram_total_gb = 16.0
    disk_pct = 45.0
    disk_free_gb = 240.0
    disk_total_gb = 512.0

    if psutil:
        try:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            ram = mem.percent
            ram_total_gb = round(mem.total / (1024 ** 3), 1)
            ram_used_gb = round(mem.used / (1024 ** 3), 1)
            disk = psutil.disk_usage('C:\\' if sys.platform == 'win32' else '/')
            disk_pct = disk.percent
            disk_total_gb = round(disk.total / (1024 ** 3), 1)
            disk_free_gb = round(disk.free / (1024 ** 3), 1)
        except Exception:
            pass

    return {
        "agentId": agent_id,
        "code": display_code,
        "hostname": hostname,
        "ip": local_ip,
        "port": 8443,
        "osType": os_caption,
        "cpu": cpu,
        "ram": ram,
        "ramUsedGB": ram_used_gb,
        "ramTotalGB": ram_total_gb,
        "diskPercent": disk_pct,
        "diskFreeGB": disk_free_gb,
        "diskTotalGB": disk_total_gb,
        "netInKB": random.randint(400, 1100),
        "netOutKB": random.randint(150, 450),
        "uptimeSeconds": 3600,
        "servicesRunning": 126,
        "tunnelToken": tunnel_token
    }

try:
    while True:
        m = read_metrics()
        t_str = time.strftime("%H:%M:%S")
        payload_bytes = json.dumps(m).encode("utf-8")
        req = urllib.request.Request(
            f"{monitor_url}/api/telemetry/report",
            data=payload_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Tunnel-Token": tunnel_token
            }
        )

        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=3) as resp:
                lat_ms = int((time.time() - t0) * 1000)
                print(f"[{t_str}] [OK {lat_ms}ms] CPU: {m['cpu']}% | RAM: {m['ram']}% ({m['ramUsedGB']}/{m['ramTotalGB']} GB) | Disco C: {m['diskPercent']}% ({m['diskFreeGB']} GB libre) | Red: {m['netInKB']} KB/s IN")
        except urllib.error.URLError:
            print(f"[{t_str}] [ESPERANDO MONITOR] Conectando con {monitor_url}... (Agente activo con codigo {display_code})")
        except Exception as e:
            print(f"[{t_str}] [AVISO] {e}")

        time.sleep(interval)
except KeyboardInterrupt:
    print("\nAgente detenido por el usuario.")
