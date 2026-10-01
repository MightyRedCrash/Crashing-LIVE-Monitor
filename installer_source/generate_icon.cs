using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;

namespace IconGenerator
{
    class Program
    {
        static void Main()
        {
            int[] sizes = new int[] { 256, 128, 64, 48, 32, 16 };
            List<byte[]> pngBuffers = new List<byte[]>();

            foreach (int size in sizes)
            {
                using (Bitmap bmp = RenderLogo(size))
                {
                    using (MemoryStream ms = new MemoryStream())
                    {
                        bmp.Save(ms, ImageFormat.Png);
                        pngBuffers.Add(ms.ToArray());
                    }
                }
            }

            // Save public PNGs
            string publicDir = Path.Combine(Directory.GetCurrentDirectory(), "public");
            if (!Directory.Exists(publicDir)) Directory.CreateDirectory(publicDir);

            using (Bitmap big = RenderLogo(512))
            {
                big.Save(Path.Combine(publicDir, "logo512.png"), ImageFormat.Png);
            }
            using (Bitmap mid = RenderLogo(192))
            {
                mid.Save(Path.Combine(publicDir, "logo192.png"), ImageFormat.Png);
            }
            using (Bitmap sm = RenderLogo(64))
            {
                sm.Save(Path.Combine(publicDir, "logo.png"), ImageFormat.Png);
            }

            // Build multi-resolution ICO file
            byte[] icoBytes = BuildIcoFile(sizes, pngBuffers);

            File.WriteAllBytes("app.ico", icoBytes);
            File.WriteAllBytes(Path.Combine(publicDir, "favicon.ico"), icoBytes);

            string assetsDir = Path.Combine(Directory.GetCurrentDirectory(), "installer_assets");
            if (!Directory.Exists(assetsDir)) Directory.CreateDirectory(assetsDir);
            File.WriteAllBytes(Path.Combine(assetsDir, "app.ico"), icoBytes);

            Console.WriteLine("Icon generated successfully! Size: " + icoBytes.Length + " bytes.");
        }

        static Bitmap RenderLogo(int size)
        {
            Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.Clear(Color.Transparent);

                float scale = size / 48.0f;

                // 1. Fondo cuadrado redondeado negro / grafito oscuro
                float cornerRadius = 9.0f * scale;
                RectangleF bgRect = new RectangleF(1.0f * scale, 1.0f * scale, 46.0f * scale, 46.0f * scale);
                using (GraphicsPath path = RoundedRect(bgRect, cornerRadius))
                {
                    // Degradado oscuro elegante
                    using (LinearGradientBrush brush = new LinearGradientBrush(
                        bgRect, 
                        Color.FromArgb(255, 14, 17, 24), 
                        Color.FromArgb(255, 5, 7, 10), 
                        LinearGradientMode.Vertical))
                    {
                        g.FillPath(brush, path);
                    }

                    // Borde sutil con tono verde neón / zinc
                    using (Pen borderPen = new Pen(Color.FromArgb(160, 0, 255, 102), 1.2f * scale))
                    {
                        g.DrawPath(borderPen, path);
                    }
                }

                // 2. Tres Módulos de Servidor en Rack (Blade Chassis)
                float[] serverY = new float[] { 9.0f * scale, 19.0f * scale, 29.0f * scale };
                float serverW = 34.0f * scale;
                float serverH = 7.5f * scale;
                float serverX = 7.0f * scale;
                float sRadius = 1.8f * scale;

                for (int i = 0; i < 3; i++)
                {
                    RectangleF sRect = new RectangleF(serverX, serverY[i], serverW, serverH);
                    using (GraphicsPath sPath = RoundedRect(sRect, sRadius))
                    {
                        using (SolidBrush sBrush = new SolidBrush(Color.FromArgb(240, 10, 14, 20)))
                        {
                            g.FillPath(sBrush, sPath);
                        }
                        using (Pen sPen = new Pen(Color.FromArgb(180, 42, 46, 56), 0.8f * scale))
                        {
                            g.DrawPath(sPen, sPath);
                        }
                    }

                    // Rejillas de ventilación derechas
                    using (Pen ventPen = new Pen(Color.FromArgb(160, 60, 65, 80), 0.9f * scale))
                    {
                        g.DrawLine(ventPen, 31.0f * scale, serverY[i] + 3.75f * scale, 37.0f * scale, serverY[i] + 3.75f * scale);
                    }
                }

                // LEDs de estado en cada servidor
                DrawLed(g, scale, 11.0f, 12.75f, Color.FromArgb(0, 255, 102)); // Servidor 1: Verde Neón
                DrawLed(g, scale, 14.5f, 12.75f, Color.FromArgb(255, 170, 0)); // Servidor 1: Ámbar

                DrawLed(g, scale, 11.0f, 22.75f, Color.FromArgb(0, 255, 102)); // Servidor 2: Verde Neón
                DrawLed(g, scale, 14.5f, 22.75f, Color.FromArgb(0, 229, 255)); // Servidor 2: Cyan

                DrawLed(g, scale, 11.0f, 32.75f, Color.FromArgb(255, 107, 0)); // Servidor 3: Naranja
                DrawLed(g, scale, 14.5f, 32.75f, Color.FromArgb(0, 255, 102)); // Servidor 3: Verde Neón

                // 3. Señal de Telemetría Verde Neón (ECG / Pulso de Red)
                PointF[] pulsePoints = new PointF[] {
                    new PointF(5.0f * scale, 22.75f * scale),
                    new PointF(18.0f * scale, 22.75f * scale),
                    new PointF(20.5f * scale, 20.5f * scale),
                    new PointF(22.5f * scale, 25.0f * scale),
                    new PointF(24.5f * scale, 21.5f * scale),
                    new PointF(26.5f * scale, 22.75f * scale),
                    new PointF(28.5f * scale, 27.0f * scale),
                    new PointF(32.5f * scale, 6.0f * scale),  // PICO MÁXIMO
                    new PointF(36.5f * scale, 34.5f * scale), // VALLE
                    new PointF(39.0f * scale, 21.0f * scale),
                    new PointF(41.0f * scale, 22.75f * scale),
                    new PointF(43.5f * scale, 22.75f * scale)
                };

                // Resplandor verde exterior (Glow)
                using (Pen glowPen = new Pen(Color.FromArgb(90, 0, 255, 102), 3.8f * scale))
                {
                    glowPen.StartCap = LineCap.Round;
                    glowPen.EndCap = LineCap.Round;
                    glowPen.LineJoin = LineJoin.Round;
                    g.DrawLines(glowPen, pulsePoints);
                }

                // Línea nítida verde neón
                using (Pen neonPen = new Pen(Color.FromArgb(255, 0, 255, 102), 2.2f * scale))
                {
                    neonPen.StartCap = LineCap.Round;
                    neonPen.EndCap = LineCap.Round;
                    neonPen.LineJoin = LineJoin.Round;
                    g.DrawLines(neonPen, pulsePoints);
                }

                // Núcleo blanco de la línea para dar efecto láser
                using (Pen corePen = new Pen(Color.FromArgb(200, 255, 255, 255), 0.9f * scale))
                {
                    corePen.StartCap = LineCap.Round;
                    corePen.EndCap = LineCap.Round;
                    corePen.LineJoin = LineJoin.Round;
                    g.DrawLines(corePen, pulsePoints);
                }

                // 4. Destello / Starburst en el pico superior (X: 32.5, Y: 6.0)
                float flareX = 32.5f * scale;
                float flareY = 6.0f * scale;

                // Halo naranja
                float haloR = 4.5f * scale;
                using (GraphicsPath haloPath = new GraphicsPath())
                {
                    haloPath.AddEllipse(flareX - haloR, flareY - haloR, haloR * 2, haloR * 2);
                    using (PathGradientBrush pgb = new PathGradientBrush(haloPath))
                    {
                        pgb.CenterColor = Color.FromArgb(240, 255, 150, 0);
                        pgb.SurroundColors = new Color[] { Color.FromArgb(0, 255, 80, 0) };
                        g.FillEllipse(pgb, flareX - haloR, flareY - haloR, haloR * 2, haloR * 2);
                    }
                }

                // Rayos de destello en estrella
                using (Pen rayPen = new Pen(Color.FromArgb(255, 255, 240, 200), 1.2f * scale))
                {
                    rayPen.StartCap = LineCap.Round;
                    rayPen.EndCap = LineCap.Round;
                    g.DrawLine(rayPen, flareX - 3.5f * scale, flareY, flareX + 3.5f * scale, flareY);
                    g.DrawLine(rayPen, flareX, flareY - 3.5f * scale, flareX, flareY + 3.5f * scale);
                }

                // Centro blanco brillante
                using (SolidBrush centerDot = new SolidBrush(Color.White))
                {
                    float dotR = 1.3f * scale;
                    g.FillEllipse(centerDot, flareX - dotR, flareY - dotR, dotR * 2, dotR * 2);
                }
            }
            return bmp;
        }

        static void DrawLed(Graphics g, float scale, float x, float y, Color col)
        {
            float r = 1.3f * scale;
            float px = x * scale;
            float py = y * scale;

            // Glow
            using (SolidBrush glowBrush = new SolidBrush(Color.FromArgb(90, col)))
            {
                g.FillEllipse(glowBrush, px - r * 1.8f, py - r * 1.8f, r * 3.6f, r * 3.6f);
            }
            // Dot
            using (SolidBrush dotBrush = new SolidBrush(col))
            {
                g.FillEllipse(dotBrush, px - r, py - r, r * 2, r * 2);
            }
        }

        static GraphicsPath RoundedRect(RectangleF bounds, float radius)
        {
            GraphicsPath path = new GraphicsPath();
            float diameter = radius * 2.0f;
            SizeF size = new SizeF(diameter, diameter);
            RectangleF arc = new RectangleF(bounds.Location, size);

            // top left
            path.AddArc(arc, 180, 90);
            // top right
            arc.X = bounds.Right - diameter;
            path.AddArc(arc, 270, 90);
            // bottom right
            arc.Y = bounds.Bottom - diameter;
            path.AddArc(arc, 0, 90);
            // bottom left
            arc.X = bounds.Left;
            path.AddArc(arc, 90, 90);

            path.CloseFigure();
            return path;
        }

        static byte[] BuildIcoFile(int[] sizes, List<byte[]> pngBuffers)
        {
            using (MemoryStream ms = new MemoryStream())
            using (BinaryWriter bw = new BinaryWriter(ms))
            {
                // Header
                bw.Write((short)0);      // Reserved
                bw.Write((short)1);      // Type 1 = ICO
                bw.Write((short)sizes.Length); // Image count

                int offset = 6 + (16 * sizes.Length);

                for (int i = 0; i < sizes.Length; i++)
                {
                    int s = sizes[i];
                    byte bSize = (byte)(s >= 256 ? 0 : s);
                    bw.Write(bSize);              // Width
                    bw.Write(bSize);              // Height
                    bw.Write((byte)0);            // Color count
                    bw.Write((byte)0);            // Reserved
                    bw.Write((short)1);           // Color planes
                    bw.Write((short)32);          // Bits per pixel
                    bw.Write(pngBuffers[i].Length);// Image size in bytes
                    bw.Write(offset);             // Image data offset

                    offset += pngBuffers[i].Length;
                }

                // Write PNG image bytes
                for (int i = 0; i < sizes.Length; i++)
                {
                    bw.Write(pngBuffers[i]);
                }

                return ms.ToArray();
            }
        }
    }
}
