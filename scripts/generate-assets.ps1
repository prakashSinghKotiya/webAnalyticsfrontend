Add-Type -AssemblyName System.Drawing

# -------------------------------------------------------------
# 1. Generate 1200x630 public/og-image.png
# -------------------------------------------------------------
$width = 1200
$height = 630

$bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background: #171717 dark background with subtle radial/linear depth
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 23, 23, 23))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Subtle background gradient overlay for depth (#12161f at corners to #1a1e28 center)
$rectFull = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rectFull,
    [System.Drawing.Color]::FromArgb(255, 15, 20, 28),
    [System.Drawing.Color]::FromArgb(255, 26, 31, 40),
    45.0
)
$g.FillRectangle($gradBrush, 0, 0, $width, $height)

# Ambient glow behind logo area (Emerald/Cyan radial glow)
$pathGlow = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGlow.AddEllipse(300, 100, 600, 400)
$pthGrBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGlow)
$pthGrBrush.CenterColor = [System.Drawing.Color]::FromArgb(40, 0, 229, 255)
$pthGrBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 23, 23, 23))
$g.FillPath($pthGrBrush, $pathGlow)

# Subtle border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 0, 255, 136), 2)
$g.DrawRectangle($borderPen, 1, 1, $width - 2, $height - 2)

# Card Container in Center
$cardRect = New-Object System.Drawing.Rectangle(80, 70, 1040, 490)
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 18, 22, 31))
$g.FillRectangle($cardBrush, $cardRect)
$cardBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 0, 229, 255), 1.5)
$g.DrawRectangle($cardBorderPen, $cardRect)

# Logo badge: 72x72 rounded box with gradient #00e5ff -> #00ff88
$badgeRect = New-Object System.Drawing.Rectangle(140, 130, 76, 76)
$badgeGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $badgeRect,
    [System.Drawing.Color]::FromArgb(255, 0, 229, 255),
    [System.Drawing.Color]::FromArgb(255, 0, 255, 136),
    135.0
)
$g.FillRectangle($badgeGrad, $badgeRect)

# Pulse icon polyline inside badge: stroke white, width 4
$pulsePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 4.5)
$pulsePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pulsePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pulsePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

# Points scaled into 76x76 badge at (140, 130)
[System.Drawing.PointF[]]$pts = @(
    [System.Drawing.PointF]::new(148, 168),
    [System.Drawing.PointF]::new(160, 168),
    [System.Drawing.PointF]::new(168, 142),
    [System.Drawing.PointF]::new(182, 194),
    [System.Drawing.PointF]::new(194, 168),
    [System.Drawing.PointF]::new(208, 168)
)
$g.DrawLines($pulsePen, $pts)

# Brand text: "Monitor" (White) + "MyHost" (Cyan)
$fontFamily = "Segoe UI"
$brandFont = New-Object System.Drawing.Font($fontFamily, 46, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 229, 255))
$emeraldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 255, 136))

$g.DrawString("Monitor", $brandFont, $whiteBrush, 235, 128)
$g.DrawString("MyHost", $brandFont, $cyanBrush, 470, 128)

# Tagline text
$taglineFont = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Bold)
$taglineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
$g.DrawString("Global Website Performance, TTFB, DNS & Uptime Monitoring", $taglineFont, $taglineBrush, 140, 235)

# Sub-tagline
$subFont = New-Object System.Drawing.Font($fontFamily, 15, [System.Drawing.FontStyle]::Regular)
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$g.DrawString("Distributed synthetic telemetry from edge probe locations worldwide.", $subFont, $mutedBrush, 140, 280)

# Feature badges (Pills)
$features = @(
    "⚡ Global TTFB Testing",
    "📊 Lighthouse Performance",
    "🌐 Authoritative DNS",
    "🔄 Redirect Tracer",
    "⏱️ Multi-Region Uptime"
)

$pillFont = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
$pillBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 32, 47))
$pillBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 0, 229, 255), 1.2)
$pillTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225))

$pillX = 140
$pillY = 350
foreach ($feat in $features) {
    $size = $g.MeasureString($feat, $pillFont)
    $pillWidth = $size.Width + 24
    $pillHeight = 40
    $pillRect = New-Object System.Drawing.Rectangle($pillX, $pillY, $pillWidth, $pillHeight)
    $g.FillRectangle($pillBgBrush, $pillRect)
    $g.DrawRectangle($pillBorderPen, $pillRect)
    $g.DrawString($feat, $pillFont, $pillTextBrush, ($pillX + 12), ($pillY + 9))
    $pillX += ($pillWidth + 14)
}

# Footer inside card
$footerFont = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Regular)
$footerMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
$g.DrawString("monitormyhost.com  •  Real-time Edge Telemetry  •  Free Public Web Tools", $footerFont, $footerMuted, 140, 480)

# Save og-image.png
$ogPath = Join-Path $PSScriptRoot "..\public\og-image.png"
$bmp.Save($ogPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "Created $ogPath successfully."

# -------------------------------------------------------------
# 2. Generate multi-resolution public/favicon.ico (16, 32, 48)
# -------------------------------------------------------------
function Draw-FaviconBitmap([int]$size) {
    $fbmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $fg = [System.Drawing.Graphics]::FromImage($fbmp)
    $fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Dark rounded background #12161f
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 22, 31))
    $fg.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Border with gradient #00e5ff to #00ff88
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0, 229, 255),
        [System.Drawing.Color]::FromArgb(255, 0, 255, 136),
        135.0
    )
    $bpen = New-Object System.Drawing.Pen($bgrad, [Math]::Max(1.0, ($size / 20.0)))
    $fg.DrawRectangle($bpen, 0, 0, ($size - 1), ($size - 1))

    # Pulse wave inside
    $pulsePen = New-Object System.Drawing.Pen($bgrad, [Math]::Max(1.5, ($size / 10.0)))
    $pulsePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pulsePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pulsePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Scale 32-coord system: 6, 16.5 -> 10, 16.5 -> 13, 9 -> 19, 23 -> 22, 16.5 -> 26, 16.5
    $s = $size / 32.0
    [System.Drawing.PointF[]]$pts = @(
        [System.Drawing.PointF]::new((6.0 * $s), (16.5 * $s)),
        [System.Drawing.PointF]::new((10.0 * $s), (16.5 * $s)),
        [System.Drawing.PointF]::new((13.0 * $s), (9.0 * $s)),
        [System.Drawing.PointF]::new((19.0 * $s), (23.0 * $s)),
        [System.Drawing.PointF]::new((22.0 * $s), (16.5 * $s)),
        [System.Drawing.PointF]::new((26.0 * $s), (16.5 * $s))
    )
    $fg.DrawLines($pulsePen, $pts)

    $fg.Dispose()
    return $fbmp
}

# Build valid multi-icon ICO file containing PNG streams
$sizes = @(16, 32, 48)
$pngBytesList = @()

foreach ($sz in $sizes) {
    $fbmp = Draw-FaviconBitmap $sz
    $ms = New-Object System.IO.MemoryStream
    $fbmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,$ms.ToArray()
    $ms.Dispose()
    $fbmp.Dispose()
}

$icoMs = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($icoMs)

# ICONDIR (6 bytes)
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type: 1 = Icon
$bw.Write([uint16]$sizes.Count) # Count: 3

# ICONDIRENTRY (16 bytes each)
$offset = 6 + ($sizes.Count * 16)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz = $sizes[$i]
    $pngBytes = $pngBytesList[$i]
    $bw.Write([byte]$sz) # Width
    $bw.Write([byte]$sz) # Height
    $bw.Write([byte]0)   # Color count (0 = >=8bpp)
    $bw.Write([byte]0)   # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32)# Bits per pixel
    $bw.Write([uint32]$pngBytes.Length) # Image size in bytes
    $bw.Write([uint32]$offset)          # Image offset in file
    $offset += $pngBytes.Length
}

# Image Data (PNG streams)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngBytesList[$i])
}

$icoPath = Join-Path $PSScriptRoot "..\public\favicon.ico"
[System.IO.File]::WriteAllBytes($icoPath, $icoMs.ToArray())
$bw.Dispose()
$icoMs.Dispose()
Write-Host "Created $icoPath successfully."
