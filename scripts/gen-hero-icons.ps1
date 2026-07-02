$dir = Join-Path $PSScriptRoot "..\images"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
Add-Type -AssemblyName System.Drawing

function Draw-CombineIcon($filePath, $color) {
  $size = 128
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $bmp.SetResolution(128, 128)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $c = [System.Drawing.ColorTranslator]::FromHtml($color)
  $pen = New-Object System.Drawing.Pen $c, 5
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $brush = New-Object System.Drawing.SolidBrush $c

  function Add-RoundRect($x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $r, $r, 180, 90)
    $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
    $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
    $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
    $path.CloseFigure()
    return $path
  }

  $layerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, $c)), 4
  $layerPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $layerPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $layerPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $back = Add-RoundRect 58 18 52 52 10
  $g.DrawPath($layerPen, $back)
  $back.Dispose()

  $mid = Add-RoundRect 42 34 52 52 10
  $g.DrawPath($layerPen, $mid)
  $mid.Dispose()

  $front = Add-RoundRect 18 50 58 58 12
  $g.DrawPath($pen, $front)
  $front.Dispose()

  $dots = @(
    @(28, 62), @(42, 62), @(56, 62),
    @(28, 76), @(42, 76), @(56, 76),
    @(28, 90), @(42, 90), @(56, 90)
  )
  foreach ($d in $dots) {
    $g.FillEllipse($brush, $d[0], $d[1], 8, 8)
  }

  $g.DrawLine($pen, 82, 82, 96, 96)
  $g.DrawLine($pen, 96, 82, 82, 96)

  $g.Dispose()
  $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Draw-CombineIcon (Join-Path $dir "icon-combine.png") '#FFFFFF'
Get-ChildItem $dir -Filter "icon-combine.png"
