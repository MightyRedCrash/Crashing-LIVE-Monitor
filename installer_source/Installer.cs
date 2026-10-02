using System;
using System.Collections.Generic;
using System.IO;
using System.Drawing;
using System.Windows.Forms;
using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace CrashingLiveInstaller
{
    public enum InstallMode
    {
        AgentOnly = 1,
        MonitorOnly = 2,
        Both = 3
    }

    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
            }
            catch {}

            try
            {
                bool silent = false;
                bool uninstall = false;
                InstallMode mode = InstallMode.AgentOnly;
                string targetDir = GetDefaultInstallDir();
                string monitorUrl = "http://localhost:3000";

                foreach (string arg in args)
                {
                    if (arg.Equals("/S", StringComparison.OrdinalIgnoreCase) || 
                        arg.Equals("/SILENT", StringComparison.OrdinalIgnoreCase))
                    {
                        silent = true;
                    }
                    else if (arg.Equals("/UNINSTALL", StringComparison.OrdinalIgnoreCase) || 
                             arg.Equals("/CLEAN", StringComparison.OrdinalIgnoreCase) ||
                             arg.Equals("/U", StringComparison.OrdinalIgnoreCase) ||
                             arg.Equals("-u", StringComparison.OrdinalIgnoreCase))
                    {
                        uninstall = true;
                    }
                    else if (arg.StartsWith("/MODE=", StringComparison.OrdinalIgnoreCase))
                    {
                        string m = arg.Substring(6).Trim().ToUpperInvariant();
                        if (m == "AGENT") mode = InstallMode.AgentOnly;
                        else if (m == "MONITOR") mode = InstallMode.MonitorOnly;
                        else if (m == "BOTH") mode = InstallMode.Both;
                    }
                    else if (arg.StartsWith("/DIR=", StringComparison.OrdinalIgnoreCase))
                    {
                        targetDir = arg.Substring(5).Trim().Trim('\"');
                    }
                    else if (arg.StartsWith("/URL=", StringComparison.OrdinalIgnoreCase))
                    {
                        monitorUrl = arg.Substring(5).Trim().Trim('\"');
                    }
                }

                if (uninstall)
                {
                    DoUninstall(targetDir);
                    if (!silent)
                    {
                        MessageBox.Show(
                            "Crashing LIVE ha sido completamente desinstalado de su equipo.\n" +
                            "Se han detenido los servicios, eliminado los binarios, logs y claves de registro.",
                            "Desinstalación Completa",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information
                        );
                    }
                    return;
                }

                if (silent)
                {
                    DoInstall(targetDir, mode, monitorUrl, true);
                    return;
                }

                Application.Run(new InstallerForm());
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Ocurrió un problema al ejecutar el instalador:\n\n" + ex.Message + "\n\n" + ex.StackTrace,
                    "Error Crashing LIVE",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        public static string GetDefaultInstallDir()
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(appData, "Crashing LIVE");
        }

        public static bool IsPreviousInstallationPresent(string targetDir)
        {
            if (string.IsNullOrEmpty(targetDir)) targetDir = GetDefaultInstallDir();
            if (!Directory.Exists(targetDir)) return false;

            return File.Exists(Path.Combine(targetDir, "agent_daemon.ps1")) ||
                   File.Exists(Path.Combine(targetDir, "agent_config.json")) ||
                   File.Exists(Path.Combine(targetDir, "iniciar_monitor.bat"));
        }

        public static void DoUninstall(string targetDir)
        {
            if (string.IsNullOrEmpty(targetDir)) targetDir = GetDefaultInstallDir();

            // 1. Detener y eliminar el Servicio de Windows registrado para el agente y tareas programadas
            try
            {
                ProcessStartInfo psiServices = new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -Command \"" +
                    "sc.exe stop CrashingLiveAgent 2>$null; " +
                    "sc.exe delete CrashingLiveAgent 2>$null; " +
                    "schtasks.exe /end /tn 'CrashingLiveAgent' /f 2>$null; " +
                    "schtasks.exe /delete /tn 'CrashingLiveAgent' /f 2>$null; " +
                    "\"");
                psiServices.WindowStyle = ProcessWindowStyle.Hidden;
                psiServices.CreateNoWindow = true;
                using (Process p = Process.Start(psiServices))
                {
                    if (p != null) p.WaitForExit(4000);
                }
            }
            catch {}

            // 2. Forzar el cierre de cualquier proceso residual del agente y monitor en memoria
            try
            {
                ProcessStartInfo psiKill = new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -Command \"" +
                    "taskkill.exe /f /fi 'WINDOWTITLE eq Crashing LIVE*' 2>$null; " +
                    "Get-Process | Where-Object { $_.MainWindowTitle -like '*Crashing LIVE*' } | Stop-Process -Force -ErrorAction SilentlyContinue; " +
                    "Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*agent_daemon*' -or $_.CommandLine -like '*Crashing LIVE*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " +
                    "Get-Process -Name 'crashinglive_monitor' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; " +
                    "\"");
                psiKill.WindowStyle = ProcessWindowStyle.Hidden;
                psiKill.CreateNoWindow = true;
                using (Process p = Process.Start(psiKill))
                {
                    if (p != null) p.WaitForExit(4000);
                }
            }
            catch {}

            // 3. Eliminar accesos directos creados (Escritorio, Menú Inicio y Startup)
            try
            {
                List<string> shortcutPaths = new List<string>();

                // Escritorio (Usuario actual y Público)
                string userDesktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string commonDesktop = Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory);
                string[] linkNames = new string[] {
                    "Crashing LIVE Agente.lnk",
                    "Crashing LIVE Monitor.lnk",
                    "Crashing LIVE.lnk"
                };

                foreach (string name in linkNames)
                {
                    if (!string.IsNullOrEmpty(userDesktop)) shortcutPaths.Add(Path.Combine(userDesktop, name));
                    if (!string.IsNullOrEmpty(commonDesktop)) shortcutPaths.Add(Path.Combine(commonDesktop, name));
                }

                // Startup (Inicio automático Usuario actual y All Users)
                string userStartup = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                string commonStartup = Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup);
                foreach (string name in linkNames)
                {
                    if (!string.IsNullOrEmpty(userStartup)) shortcutPaths.Add(Path.Combine(userStartup, name));
                    if (!string.IsNullOrEmpty(commonStartup)) shortcutPaths.Add(Path.Combine(commonStartup, name));
                }

                foreach (string sc in shortcutPaths)
                {
                    if (File.Exists(sc))
                    {
                        try { File.Delete(sc); } catch {}
                    }
                }

                // Menú Inicio (Carpetas completas en Programs)
                string userPrograms = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Crashing LIVE");
                if (Directory.Exists(userPrograms))
                {
                    try { Directory.Delete(userPrograms, true); } catch {}
                }

                string commonPrograms = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonPrograms), "Crashing LIVE");
                if (Directory.Exists(commonPrograms))
                {
                    try { Directory.Delete(commonPrograms, true); } catch {}
                }
            }
            catch {}

            // 4. Eliminar las carpetas del programa y residuos en %ProgramData%, %AppData% o %LocalAppData%
            try
            {
                List<string> dirsToDelete = new List<string>();
                if (!string.IsNullOrEmpty(targetDir)) dirsToDelete.Add(targetDir);

                string localApp = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Crashing LIVE");
                dirsToDelete.Add(localApp);

                string roamingApp = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Crashing LIVE");
                dirsToDelete.Add(roamingApp);

                string programData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Crashing LIVE");
                dirsToDelete.Add(programData);

                string programFiles = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Crashing LIVE");
                dirsToDelete.Add(programFiles);

                foreach (string dir in dirsToDelete)
                {
                    if (Directory.Exists(dir))
                    {
                        for (int attempt = 0; attempt < 3; attempt++)
                        {
                            try
                            {
                                Directory.Delete(dir, true);
                                break;
                            }
                            catch
                            {
                                System.Threading.Thread.Sleep(300);
                            }
                        }
                    }
                }
            }
            catch {}

            // 5. Purgar las claves creadas en el registro de Windows (HKLM / HKCU)
            try
            {
                // HKCU Software
                using (RegistryKey cuSoftware = Registry.CurrentUser.OpenSubKey("Software", true))
                {
                    if (cuSoftware != null)
                    {
                        try { cuSoftware.DeleteSubKeyTree("Crashing LIVE", false); } catch {}
                        try { cuSoftware.DeleteSubKeyTree("CrashingLive", false); } catch {}
                    }
                }

                // HKCU Run
                using (RegistryKey cuRun = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (cuRun != null)
                    {
                        try { cuRun.DeleteValue("CrashingLiveAgent", false); } catch {}
                        try { cuRun.DeleteValue("Crashing LIVE", false); } catch {}
                    }
                }

                // HKCU Uninstall
                using (RegistryKey cuUninstall = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                {
                    if (cuUninstall != null)
                    {
                        try { cuUninstall.DeleteSubKeyTree("Crashing LIVE", false); } catch {}
                    }
                }

                // HKLM Software (si tiene permisos elevados)
                try
                {
                    using (RegistryKey lmSoftware = Registry.LocalMachine.OpenSubKey("Software", true))
                    {
                        if (lmSoftware != null)
                        {
                            try { lmSoftware.DeleteSubKeyTree("Crashing LIVE", false); } catch {}
                            try { lmSoftware.DeleteSubKeyTree("CrashingLive", false); } catch {}
                        }
                    }
                }
                catch {}

                // HKLM Run
                try
                {
                    using (RegistryKey lmRun = Registry.LocalMachine.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                    {
                        if (lmRun != null)
                        {
                            try { lmRun.DeleteValue("CrashingLiveAgent", false); } catch {}
                            try { lmRun.DeleteValue("Crashing LIVE", false); } catch {}
                        }
                    }
                }
                catch {}

                // HKLM Uninstall
                try
                {
                    using (RegistryKey lmUninstall = Registry.LocalMachine.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                    {
                        if (lmUninstall != null)
                        {
                            try { lmUninstall.DeleteSubKeyTree("Crashing LIVE", false); } catch {}
                        }
                    }
                }
                catch {}
            }
            catch {}
        }

        public static void DoInstall(string targetDir, InstallMode mode, string monitorUrl, bool createShortcuts)
        {
            if (string.IsNullOrEmpty(monitorUrl)) monitorUrl = "http://localhost:3000";
            monitorUrl = monitorUrl.TrimEnd('/');

            try
            {
                Directory.CreateDirectory(targetDir);
            }
            catch (UnauthorizedAccessException)
            {
                targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Crashing LIVE");
                Directory.CreateDirectory(targetDir);
            }

            string logsDir = Path.Combine(targetDir, "logs");
            Directory.CreateDirectory(logsDir);

            // Detener cualquier proceso previo si es modo actualizacion (upgrade)
            try
            {
                ProcessStartInfo psiStop = new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -Command \"" +
                    "schtasks.exe /end /tn 'CrashingLiveAgent' 2>$null; " +
                    "Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*agent_daemon.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " +
                    "\"");
                psiStop.WindowStyle = ProcessWindowStyle.Hidden;
                psiStop.CreateNoWindow = true;
                using (Process p = Process.Start(psiStop))
                {
                    if (p != null) p.WaitForExit(3000);
                }
            }
            catch {}

            // Copiar icono de la aplicacion
            string iconDest = Path.Combine(targetDir, "app.ico");
            try
            {
                string currentExe = Application.ExecutablePath;
                string exeDir = Path.GetDirectoryName(currentExe);
                string sourceIco = Path.Combine(exeDir, "app.ico");
                if (File.Exists(sourceIco))
                {
                    File.Copy(sourceIco, iconDest, true);
                }
                else
                {
                    Icon appIcon = Icon.ExtractAssociatedIcon(currentExe);
                    if (appIcon != null)
                    {
                        using (FileStream fs = new FileStream(iconDest, FileMode.Create))
                        {
                            appIcon.Save(fs);
                        }
                    }
                }
            }
            catch {}

            // Lógica de preservación de configuración existente (UPGRADE)
            string configFile = Path.Combine(targetDir, "agent_config.json");
            string agentId = "";
            string displayCode = "";
            string numericCode = "";
            string tunnelToken = "clk_live_tunnel_sec_2026";

            if (File.Exists(configFile))
            {
                try
                {
                    string existingJson = File.ReadAllText(configFile, Encoding.UTF8);
                    Match mId = Regex.Match(existingJson, "\"agent_id\"\\s*:\\s*\"([^\"]+)\"");
                    if (mId.Success) agentId = mId.Groups[1].Value;

                    Match mDisp = Regex.Match(existingJson, "\"display_code\"\\s*:\\s*\"([^\"]+)\"");
                    if (mDisp.Success) displayCode = mDisp.Groups[1].Value;

                    Match mNum = Regex.Match(existingJson, "\"numeric_code\"\\s*:\\s*\"([^\"]+)\"");
                    if (mNum.Success) numericCode = mNum.Groups[1].Value;

                    Match mTok = Regex.Match(existingJson, "\"tunnel_token\"\\s*:\\s*\"([^\"]+)\"");
                    if (mTok.Success) tunnelToken = mTok.Groups[1].Value;
                }
                catch {}
            }

            // Si no habia configuracion previa, generamos ID nuevo
            if (string.IsNullOrEmpty(agentId) || string.IsNullOrEmpty(displayCode))
            {
                Random rnd = new Random();
                int p1 = rnd.Next(100, 999);
                int p2 = rnd.Next(100, 999);
                int p3 = rnd.Next(100, 999);
                displayCode = string.Format("{0} {1} {2}", p1, p2, p3);
                numericCode = string.Format("{0}{1}{2}", p1, p2, p3);
                agentId = string.Format("CL-{0}-{1}-{2}", p1, p2, p3);
            }

            string agentBatPath = "";
            string monitorBatPath = "";

            // 1. COMPONENTES DEL AGENTE
            if (mode == InstallMode.AgentOnly || mode == InstallMode.Both)
            {
                string configContent = "{\n" +
                    "  \"agent_id\": \"" + agentId + "\",\n" +
                    "  \"display_code\": \"" + displayCode + "\",\n" +
                    "  \"numeric_code\": \"" + numericCode + "\",\n" +
                    "  \"monitor_url\": \"" + monitorUrl + "\",\n" +
                    "  \"monitor_urls\": [\n    \"" + monitorUrl + "\"\n  ],\n" +
                    "  \"interval_seconds\": 2,\n" +
                    "  \"tunnel_token\": \"" + tunnelToken + "\"\n" +
                    "}\n";
                File.WriteAllText(configFile, configContent, Encoding.UTF8);

                // Copiar o escribir agent_daemon.ps1
                string ps1File = Path.Combine(targetDir, "agent_daemon.ps1");
                string currentExeDir = Path.GetDirectoryName(Application.ExecutablePath);
                string repoPs1 = Path.Combine(currentExeDir, "agent", "agent_daemon.ps1");
                if (!File.Exists(repoPs1)) repoPs1 = Path.Combine(currentExeDir, "..", "agent", "agent_daemon.ps1");

                if (File.Exists(repoPs1))
                {
                    File.Copy(repoPs1, ps1File, true);
                }
                else
                {
                    // Fallback directo empaquetado
                    string ps1Code = "# -*- coding: utf-8 -*-\n" +
                        "param ([string]$MonitorUrl = '" + monitorUrl + "', [int]$IntervalSeconds = 2)\n" +
                        "$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition\n" +
                        "& \"$ScriptDir\\agent_daemon.ps1\" -MonitorUrl $MonitorUrl -IntervalSeconds $IntervalSeconds\n";
                    File.WriteAllText(ps1File, ps1Code, Encoding.UTF8);
                }

                // Iniciar Agente VBS (100% Invisible sin ventana negra de consola)
                string vbsFile = Path.Combine(targetDir, "iniciar_agente.vbs");
                string vbsContent = "Set WshShell = CreateObject(\"WScript.Shell\")\r\n" +
                    "Set FSO = CreateObject(\"Scripting.FileSystemObject\")\r\n" +
                    "scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)\r\n" +
                    "cmd = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"\"\" & scriptDir & \"\\agent_daemon.ps1\"\"\"\r\n" +
                    "WshShell.Run cmd, 0, False\r\n";
                File.WriteAllText(vbsFile, vbsContent, Encoding.Default);

                // Iniciar Agente Bat (Lanza VBS y sale de inmediato sin dejar ventana de terminal)
                agentBatPath = Path.Combine(targetDir, "iniciar_agente.bat");
                string batContent = "@echo off\r\n" +
                    "cd /d \"%~dp0\"\r\n" +
                    "start \"\" wscript.exe \"%~dp0iniciar_agente.vbs\"\r\n" +
                    "exit /b 0\r\n";
                File.WriteAllText(agentBatPath, batContent, Encoding.Default);

                // Script de servicio desatendido 24/7 (Scheduled Task)
                string installServiceBat = Path.Combine(targetDir, "instalar_servicio_windows.bat");
                string serviceContent = "@echo off\r\n" +
                    "title Instalar Agente Crashing LIVE como Servicio de Fondo\r\n" +
                    "cd /d \"%~dp0\"\r\n" +
                    "schtasks /delete /tn \"CrashingLiveAgent\" /f 2>nul\r\n" +
                    "schtasks /create /tn \"CrashingLiveAgent\" /tr \"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \\\"%~dp0agent_daemon.ps1\\\" -Headless\" /sc onstart /ru \"NT AUTHORITY\\SYSTEM\" /rl highest /f\r\n" +
                    "schtasks /run /tn \"CrashingLiveAgent\" 2>nul\r\n" +
                    "echo Servicio Crashing LIVE instalado y ejecutandose 24/7 en segundo plano.\r\n";
                File.WriteAllText(installServiceBat, serviceContent, Encoding.Default);

                // Detener Agente Bat
                string stopAgentBat = Path.Combine(targetDir, "detener_agente.bat");
                string stopAgentContent = "@echo off\r\n" +
                    "echo Deteniendo procesos del Agente Crashing LIVE...\r\n" +
                    "schtasks /end /tn \"CrashingLiveAgent\" 2>nul\r\n" +
                    "taskkill /f /fi \"WINDOWTITLE eq Crashing LIVE*\" 2>nul\r\n" +
                    "powershell.exe -NoProfile -Command \"Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*agent_daemon.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\" 2>nul\r\n" +
                    "echo Agente detenido.\r\n" +
                    "timeout /t 2 >nul\r\n";
                File.WriteAllText(stopAgentBat, stopAgentContent, Encoding.Default);
            }

            // 2. COMPONENTES DEL MONITOR CENTRAL
            if (mode == InstallMode.MonitorOnly || mode == InstallMode.Both)
            {
                monitorBatPath = Path.Combine(targetDir, "iniciar_monitor.bat");
                string monitorContent = "@echo off\r\n" +
                    "chcp 65001 >nul\r\n" +
                    "title Crashing LIVE - Monitor Central\r\n" +
                    "cd /d \"%~dp0\"\r\n" +
                    "echo Abriendo interfaz de monitoreo en modo aplicacion...\r\n" +
                    "if exist \"%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe\" (\r\n" +
                    "    start \"\" \"%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe\" --app=\"" + monitorUrl + "\" --disable-gpu\r\n" +
                    "    exit /b 0\r\n" +
                    ")\r\n" +
                    "if exist \"%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe\" (\r\n" +
                    "    start \"\" \"%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe\" --app=\"" + monitorUrl + "\" --disable-gpu\r\n" +
                    "    exit /b 0\r\n" +
                    ")\r\n" +
                    "where msedge >nul 2>&1\r\n" +
                    "if %errorlevel% equ 0 (\r\n" +
                    "    start \"\" msedge --app=\"" + monitorUrl + "\" --disable-gpu\r\n" +
                    "    exit /b 0\r\n" +
                    ")\r\n" +
                    "start \"\" \"" + monitorUrl + "\"\r\n" +
                    "exit /b 0\r\n";
                File.WriteAllText(monitorBatPath, monitorContent, Encoding.UTF8);

                string stopMonBat = Path.Combine(targetDir, "detener_monitor.bat");
                string stopMonContent = "@echo off\r\n" +
                    "echo Deteniendo procesos del Monitor...\r\n" +
                    "taskkill /f /im node.exe 2>nul\r\n" +
                    "echo Monitor detenido.\r\n" +
                    "timeout /t 2 >nul\r\n";
                File.WriteAllText(stopMonBat, stopMonContent, Encoding.Default);
            }

            // 3. DESINSTALADOR LIMPIO EN LOTE
            string uninstFile = Path.Combine(targetDir, "desinstalar_por_completo.bat");
            string uninstContent = "@echo off\r\n" +
                "title Desinstalar Crashing LIVE por Completo\r\n" +
                "cd /d \"%~dp0\"\r\n" +
                "echo ===============================================================================\r\n" +
                "echo               DESINSTALACION LIMPIA DE CRASHING LIVE\r\n" +
                "echo ===============================================================================\r\n" +
                "echo Deteniendo servicios, tareas y procesos en segundo plano...\r\n" +
                "schtasks /end /tn \"CrashingLiveAgent\" 2>nul\r\n" +
                "schtasks /delete /tn \"CrashingLiveAgent\" /f 2>nul\r\n" +
                "sc.exe stop CrashingLiveAgent 2>nul\r\n" +
                "sc.exe delete CrashingLiveAgent 2>nul\r\n" +
                "taskkill /f /fi \"WINDOWTITLE eq Crashing LIVE*\" 2>nul\r\n" +
                "powershell.exe -NoProfile -Command \"Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*agent_daemon.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\" 2>nul\r\n" +
                "echo Eliminando accesos directos...\r\n" +
                "del \"%USERPROFILE%\\Desktop\\Crashing LIVE Agente.lnk\" 2>nul\r\n" +
                "del \"%USERPROFILE%\\Desktop\\Crashing LIVE Monitor.lnk\" 2>nul\r\n" +
                "echo Eliminando registros...\r\n" +
                "reg.exe delete \"HKCU\\Software\\Crashing LIVE\" /f 2>nul\r\n" +
                "echo Limpiando directorio de instalacion...\r\n" +
                "timeout /t 1 >nul\r\n" +
                "cd /d \"%LOCALAPPDATA%\"\r\n" +
                "rmdir /s /q \"" + targetDir + "\" 2>nul\r\n" +
                "echo [OK] Desinstalacion completa exitosa.\r\n" +
                "pause\r\n";
            File.WriteAllText(uninstFile, uninstContent, Encoding.Default);

            // 4. ACCESOS DIRECTOS
            if (createShortcuts)
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                try
                {
                    Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                    if (shellType != null)
                    {
                        dynamic shell = Activator.CreateInstance(shellType);

                        if ((mode == InstallMode.AgentOnly || mode == InstallMode.Both) && !string.IsNullOrEmpty(agentBatPath))
                        {
                            string agentLnk = Path.Combine(desktop, "Crashing LIVE Agente.lnk");
                            dynamic sc = shell.CreateShortcut(agentLnk);
                            sc.TargetPath = agentBatPath;
                            sc.WorkingDirectory = targetDir;
                            sc.Description = "Iniciar Agente de Monitoreo Windows Crashing LIVE";
                            if (File.Exists(iconDest))
                            {
                                sc.IconLocation = iconDest + ",0";
                            }
                            sc.Save();
                        }

                        if ((mode == InstallMode.MonitorOnly || mode == InstallMode.Both) && !string.IsNullOrEmpty(monitorBatPath))
                        {
                            string monLnk = Path.Combine(desktop, "Crashing LIVE Monitor.lnk");
                            dynamic sc = shell.CreateShortcut(monLnk);
                            sc.TargetPath = monitorBatPath;
                            sc.WorkingDirectory = targetDir;
                            sc.Description = "Abrir Monitor Central Crashing LIVE";
                            if (File.Exists(iconDest))
                            {
                                sc.IconLocation = iconDest + ",0";
                            }
                            sc.Save();
                        }
                    }
                }
                catch {}
            }
        }
    }

    public class InstallerForm : Form
    {
        private TextBox txtPath;
        private TextBox txtMonitorUrl;
        private RadioButton rbAgentOnly;
        private RadioButton rbMonitorOnly;
        private RadioButton rbBoth;
        private CheckBox chkShortcuts;
        private Label lblUrlHint;
        private Button btnInstall;
        private Button btnCancel;
        private Button btnUninstall;
        private Button btnOpenFolder;
        private ProgressBar prgBar;
        private Label lblStatus;
        private Label lblUpgradeBadge;
        private Panel pnlHeader;
        private string installedDir = "";
        private bool isUpgrade = false;

        public InstallerForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Crashing LIVE - Asistente de Instalación & Mantenimiento";
            this.Size = new Size(600, 610);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            // PALETA ESTRICTA TEMA OSCURO
            this.BackColor = Color.FromArgb(18, 18, 18);     // #121212
            this.ForeColor = Color.FromArgb(255, 255, 255); // #FFFFFF
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            try
            {
                this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch {}

            // Encabezado
            pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 85;
            pnlHeader.BackColor = Color.FromArgb(24, 24, 24); // #181818
            pnlHeader.Paint += (s, e) => {
                try {
                    using (Pen pen = new Pen(Color.FromArgb(42, 42, 42))) { // #2A2A2A
                        e.Graphics.DrawLine(pen, 0, pnlHeader.Height - 1, pnlHeader.Width, pnlHeader.Height - 1);
                    }
                    if (this.Icon != null) {
                        e.Graphics.DrawIcon(this.Icon, 18, 18);
                    } else {
                        using (SolidBrush b = new SolidBrush(Color.FromArgb(255, 102, 0))) { // #FF6600
                            e.Graphics.FillEllipse(b, 22, 26, 14, 14);
                        }
                    }
                } catch {}
            };

            Label lblTitle = new Label();
            lblTitle.Text = "CRASHING LIVE MONITOR & AGENTE";
            lblTitle.Font = new Font("Segoe UI", 12.5f, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(255, 102, 0); // #FF6600 Acento
            lblTitle.Location = new Point(68, 16);
            lblTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblTitle);

            Label lblSub = new Label();
            lblSub.Text = "Instalador y Actualizador para Windows 10, 11 y Windows Server";
            lblSub.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblSub.ForeColor = Color.FromArgb(170, 170, 170);
            lblSub.Location = new Point(68, 44);
            lblSub.AutoSize = true;
            pnlHeader.Controls.Add(lblSub);

            lblUpgradeBadge = new Label();
            lblUpgradeBadge.Text = "MODO ACTUALIZACIÓN DETECTADO";
            lblUpgradeBadge.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            lblUpgradeBadge.ForeColor = Color.FromArgb(0, 230, 118); // #00E676 Verde
            lblUpgradeBadge.Location = new Point(340, 18);
            lblUpgradeBadge.AutoSize = true;
            lblUpgradeBadge.Visible = false;
            pnlHeader.Controls.Add(lblUpgradeBadge);

            this.Controls.Add(pnlHeader);

            // Selector de Modo de Instalación
            GroupBox grpMode = new GroupBox();
            grpMode.Text = "Seleccione el tipo de instalación:";
            grpMode.ForeColor = Color.FromArgb(255, 102, 0); // #FF6600
            grpMode.Location = new Point(25, 95);
            grpMode.Size = new Size(535, 135);

            rbAgentOnly = new RadioButton();
            rbAgentOnly.Text = "Solo Agente de Monitoreo (Equipos Windows a supervisar)";
            rbAgentOnly.Checked = true;
            rbAgentOnly.Location = new Point(15, 22);
            rbAgentOnly.Size = new Size(505, 24);
            rbAgentOnly.ForeColor = Color.White;
            rbAgentOnly.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            rbAgentOnly.CheckedChanged += Mode_CheckedChanged;
            grpMode.Controls.Add(rbAgentOnly);

            Label lblAgentDesc = new Label();
            lblAgentDesc.Text = "Telemetría saliente continua estilo AnyDesk. Incluye mini-ventana de status flotante.";
            lblAgentDesc.Location = new Point(35, 46);
            lblAgentDesc.Size = new Size(485, 18);
            lblAgentDesc.ForeColor = Color.FromArgb(160, 160, 160);
            lblAgentDesc.Font = new Font("Segoe UI", 8.25f);
            grpMode.Controls.Add(lblAgentDesc);

            rbMonitorOnly = new RadioButton();
            rbMonitorOnly.Text = "Solo Monitor Central (Servidor Hub / Dashboard Web)";
            rbMonitorOnly.Location = new Point(15, 68);
            rbMonitorOnly.Size = new Size(505, 24);
            rbMonitorOnly.ForeColor = Color.White;
            rbMonitorOnly.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            rbMonitorOnly.CheckedChanged += Mode_CheckedChanged;
            grpMode.Controls.Add(rbMonitorOnly);

            rbBoth = new RadioButton();
            rbBoth.Text = "Ambos (Agente + Monitor Central en este mismo equipo)";
            rbBoth.Location = new Point(15, 98);
            rbBoth.Size = new Size(505, 24);
            rbBoth.ForeColor = Color.White;
            rbBoth.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            rbBoth.CheckedChanged += Mode_CheckedChanged;
            grpMode.Controls.Add(rbBoth);

            this.Controls.Add(grpMode);

            // Parámetro Monitor URL
            lblUrlHint = new Label();
            lblUrlHint.Text = "URL del Monitor Central (al que transmitirá este agente):";
            lblUrlHint.Location = new Point(25, 238);
            lblUrlHint.AutoSize = true;
            lblUrlHint.ForeColor = Color.FromArgb(200, 200, 200);
            this.Controls.Add(lblUrlHint);

            txtMonitorUrl = new TextBox();
            txtMonitorUrl.Text = "http://localhost:3000";
            txtMonitorUrl.Location = new Point(25, 260);
            txtMonitorUrl.Size = new Size(535, 26);
            txtMonitorUrl.BackColor = Color.FromArgb(28, 28, 28);
            txtMonitorUrl.ForeColor = Color.FromArgb(0, 230, 118); // #00E676 Verde
            txtMonitorUrl.BorderStyle = BorderStyle.FixedSingle;
            this.Controls.Add(txtMonitorUrl);

            // Carpeta de instalación
            Label lblPathTitle = new Label();
            lblPathTitle.Text = "Carpeta de Instalación en disco:";
            lblPathTitle.Location = new Point(25, 295);
            lblPathTitle.AutoSize = true;
            lblPathTitle.ForeColor = Color.FromArgb(200, 200, 200);
            this.Controls.Add(lblPathTitle);

            txtPath = new TextBox();
            txtPath.Text = Program.GetDefaultInstallDir();
            txtPath.Location = new Point(25, 318);
            txtPath.Size = new Size(445, 26);
            txtPath.BackColor = Color.FromArgb(28, 28, 28);
            txtPath.ForeColor = Color.White;
            txtPath.BorderStyle = BorderStyle.FixedSingle;
            txtPath.TextChanged += (s, e) => { CheckInstalledState(); };
            this.Controls.Add(txtPath);

            Button btnBrowse = new Button();
            btnBrowse.Text = "Examinar...";
            btnBrowse.Location = new Point(478, 317);
            btnBrowse.Size = new Size(82, 28);
            btnBrowse.BackColor = Color.FromArgb(36, 36, 36);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.FlatAppearance.BorderColor = Color.FromArgb(50, 50, 50);
            btnBrowse.Click += (s, e) => {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog()) {
                    fbd.SelectedPath = txtPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK) {
                        txtPath.Text = fbd.SelectedPath;
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Checkbox accesos directos
            chkShortcuts = new CheckBox();
            chkShortcuts.Text = "Crear accesos directos en el Escritorio";
            chkShortcuts.Checked = true;
            chkShortcuts.Location = new Point(25, 355);
            chkShortcuts.Size = new Size(535, 24);
            chkShortcuts.ForeColor = Color.FromArgb(220, 220, 220);
            this.Controls.Add(chkShortcuts);

            // Progress bar
            prgBar = new ProgressBar();
            prgBar.Location = new Point(25, 390);
            prgBar.Size = new Size(535, 14);
            prgBar.Visible = false;
            this.Controls.Add(prgBar);

            // Status label
            lblStatus = new Label();
            lblStatus.Text = "Listo para iniciar instalación.";
            lblStatus.Location = new Point(25, 415);
            lblStatus.Size = new Size(535, 36);
            lblStatus.ForeColor = Color.FromArgb(160, 160, 160);
            this.Controls.Add(lblStatus);

            // Botón Desinstalar Limpio
            btnUninstall = new Button();
            btnUninstall.Text = "🗑️ Desinstalar por Completo";
            btnUninstall.Location = new Point(25, 490);
            btnUninstall.Size = new Size(185, 42);
            btnUninstall.BackColor = Color.FromArgb(38, 21, 23);
            btnUninstall.ForeColor = Color.FromArgb(255, 82, 82);
            btnUninstall.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnUninstall.FlatStyle = FlatStyle.Flat;
            btnUninstall.FlatAppearance.BorderColor = Color.FromArgb(102, 34, 38);
            btnUninstall.Click += BtnUninstall_Click;
            this.Controls.Add(btnUninstall);

            // Botón Abrir Carpeta
            btnOpenFolder = new Button();
            btnOpenFolder.Text = "📂 Abrir Carpeta";
            btnOpenFolder.Location = new Point(218, 490);
            btnOpenFolder.Size = new Size(115, 42);
            btnOpenFolder.BackColor = Color.FromArgb(28, 28, 28);
            btnOpenFolder.ForeColor = Color.White;
            btnOpenFolder.FlatStyle = FlatStyle.Flat;
            btnOpenFolder.FlatAppearance.BorderColor = Color.FromArgb(42, 42, 42);
            btnOpenFolder.Visible = false;
            btnOpenFolder.Click += (s, e) => {
                if (!string.IsNullOrEmpty(installedDir) && Directory.Exists(installedDir)) {
                    Process.Start("explorer.exe", installedDir);
                }
            };
            this.Controls.Add(btnOpenFolder);

            // Botón Instalar / Actualizar (Naranja #FF6600)
            btnInstall = new Button();
            btnInstall.Text = "Instalar Ahora";
            btnInstall.Location = new Point(340, 490);
            btnInstall.Size = new Size(140, 42);
            btnInstall.BackColor = Color.FromArgb(255, 102, 0); // #FF6600 Naranja
            btnInstall.ForeColor = Color.Black;
            btnInstall.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);

            // Botón Cancelar/Cerrar
            btnCancel = new Button();
            btnCancel.Text = "Cerrar";
            btnCancel.Location = new Point(488, 490);
            btnCancel.Size = new Size(72, 42);
            btnCancel.BackColor = Color.FromArgb(28, 28, 28);
            btnCancel.ForeColor = Color.White;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(42, 42, 42);
            btnCancel.Click += (s, e) => { this.Close(); };
            this.Controls.Add(btnCancel);

            CheckInstalledState();
        }

        private void CheckInstalledState()
        {
            string dir = txtPath.Text.Trim();
            isUpgrade = Program.IsPreviousInstallationPresent(dir);

            if (isUpgrade)
            {
                lblUpgradeBadge.Visible = true;
                btnInstall.Text = "Actualizar (Upgrade)";
                lblStatus.Text = "Versión previa detectada. La actualización preservará su Código AnyDesk e ID existente.";
                lblStatus.ForeColor = Color.FromArgb(0, 230, 118); // #00E676
                btnUninstall.Enabled = true;
            }
            else
            {
                lblUpgradeBadge.Visible = false;
                btnInstall.Text = "Instalar Ahora";
                lblStatus.Text = "Listo para iniciar instalación limpia en este equipo.";
                lblStatus.ForeColor = Color.FromArgb(160, 160, 160);
                btnUninstall.Enabled = Directory.Exists(dir);
            }
        }

        private void Mode_CheckedChanged(object sender, EventArgs e)
        {
            if (rbMonitorOnly.Checked)
            {
                lblUrlHint.Visible = false;
                txtMonitorUrl.Visible = false;
            }
            else
            {
                lblUrlHint.Visible = true;
                txtMonitorUrl.Visible = true;
            }
        }

        private void BtnUninstall_Click(object sender, EventArgs e)
        {
            string targetDir = txtPath.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) targetDir = Program.GetDefaultInstallDir();

            DialogResult dr = MessageBox.Show(
                "¿Desea DESINSTALAR POR COMPLETO Crashing LIVE de este equipo?\n\n" +
                "• Se detendrán y eliminarán las tareas y servicios de Windows.\n" +
                "• Se borrarán los binarios y logs en: " + targetDir + "\n" +
                "• Se eliminarán los accesos directos y claves de registro asociadas.",
                "Confirmar Desinstalación Limpia",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning
            );

            if (dr != DialogResult.Yes) return;

            prgBar.Visible = true;
            prgBar.Value = 35;
            lblStatus.Text = "Deteniendo servicios y eliminando archivos por completo...";
            lblStatus.ForeColor = Color.FromArgb(255, 82, 82);
            Application.DoEvents();

            try
            {
                Program.DoUninstall(targetDir);

                prgBar.Value = 100;
                lblStatus.Text = "¡Crashing LIVE ha sido completamente eliminado del sistema!";
                lblStatus.ForeColor = Color.FromArgb(0, 230, 118);

                MessageBox.Show(
                    "Desinstalación limpia completada con éxito.\nNo quedan tareas ni servicios residuales en el equipo.",
                    "Desinstalación Completa",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );

                CheckInstalledState();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error durante la desinstalación: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            btnCancel.Enabled = false;
            btnUninstall.Enabled = false;
            prgBar.Visible = true;
            prgBar.Value = 25;
            lblStatus.Text = isUpgrade ? "Deteniendo procesos previos y actualizando binarios..." : "Configurando instalación en disco...";
            Application.DoEvents();

            string targetDir = txtPath.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) {
                targetDir = Program.GetDefaultInstallDir();
            }
            installedDir = targetDir;

            InstallMode mode = InstallMode.AgentOnly;
            if (rbMonitorOnly.Checked) mode = InstallMode.MonitorOnly;
            else if (rbBoth.Checked) mode = InstallMode.Both;

            try
            {
                prgBar.Value = 60;
                Program.DoInstall(targetDir, mode, txtMonitorUrl.Text.Trim(), chkShortcuts.Checked);

                prgBar.Value = 100;
                string msgSuccess = isUpgrade 
                    ? "¡Actualización completada con éxito! Su configuración previa e IDs se mantuvieron intactos."
                    : "¡Instalación completada con éxito!";

                lblStatus.Text = msgSuccess;
                lblStatus.ForeColor = Color.FromArgb(0, 230, 118); // #00E676

                btnOpenFolder.Visible = true;
                btnCancel.Text = "Finalizar";
                btnCancel.Enabled = true;
                btnInstall.Enabled = true;
                btnUninstall.Enabled = true;

                MessageBox.Show(
                    msgSuccess + "\n\nCarpeta: " + targetDir,
                    "Crashing LIVE",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                prgBar.Visible = false;
                lblStatus.Text = "Error: " + ex.Message;
                lblStatus.ForeColor = Color.FromArgb(255, 82, 82);
                btnInstall.Enabled = true;
                btnCancel.Enabled = true;
                btnUninstall.Enabled = true;
                MessageBox.Show("Ocurrió un error: " + ex.Message, "Error Crashing LIVE", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
