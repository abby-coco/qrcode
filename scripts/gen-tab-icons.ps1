$dir = Join-Path $PSScriptRoot "..\images"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
Add-Type -AssemblyName System.Drawing

function Draw-TabIcon($path, $color, $type) {
  $size = 81
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $bmp.SetResolution(81, 81)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($color)), 4
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color))
  switch ($type) {
    'home' {
      $housePath = New-Object System.Drawing.Drawing2D.GraphicsPath
      $housePath.AddLine(40, 18, 17, 44)
      $housePath.AddLine(17, 44, 17, 62)
      $housePath.AddLine(17, 62, 64, 62)
      $housePath.AddLine(64, 62, 64, 44)
      $housePath.AddLine(64, 44, 40, 18)
      $g.DrawPath($pen, $housePath)
      $g.DrawRectangle($pen, 33, 47, 15, 15)
    }
    'template' {
      $g.FillRectangle($brush, 18, 20, 18, 18)
      $g.FillRectangle($brush, 45, 20, 18, 18)
      $g.FillRectangle($brush, 18, 43, 18, 18)
      $g.FillRectangle($brush, 45, 43, 18, 18)
    }
    'history' {
      $g.DrawEllipse($pen, 20, 18, 41, 41)
      $g.DrawLine($pen, 40, 40, 40, 28)
      $g.DrawLine($pen, 40, 40, 50, 45)
      $g.DrawLine($pen, 18, 62, 63, 62)
    }
    'quotes' {
      $g.FillEllipse($brush, 19, 22, 15, 13)
      $g.FillRectangle($brush, 24, 31, 5, 14)
      $g.FillEllipse($brush, 47, 22, 15, 13)
      $g.FillRectangle($brush, 52, 31, 5, 14)
      $g.FillRectangle($brush, 22, 56, 37, 4)
    }
  }
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$items = @(
  @{ n = 'tab-home'; t = 'home' },
  @{ n = 'tab-template'; t = 'template' },
  @{ n = 'tab-history'; t = 'history' },
  @{ n = 'tab-quotes'; t = 'quotes' }
)
foreach ($item in $items) {
  Draw-TabIcon (Join-Path $dir "$($item.n).png") '#999999' $item.t
  Draw-TabIcon (Join-Path $dir "$($item.n)-active.png") '#7c6cf0' $item.t
}
Get-ChildItem $dir
