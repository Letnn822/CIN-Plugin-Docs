param(
  [int]$Port = 8080,
  [string]$Root = $(Join-Path $PSScriptRoot '.')
)

# HttpListener is available by default in modern PowerShell (5+/7+); no Add-Type needed
$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $Root at $prefix (Ctrl+C to stop)"

$mime = @{ 
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8';
  '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.svg'='image/svg+xml';
}

function Get-LocalPath([string]$urlPath){
  $local = ($urlPath -replace '/', '\').TrimStart('\')
  if ([string]::IsNullOrWhiteSpace($local)) { $local = 'index.html' }
  $candidate = Join-Path $Root $local
  if (Test-Path $candidate -PathType Container) { return (Join-Path $candidate 'index.html') }
  return $candidate
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $path = Get-LocalPath $ctx.Request.Url.AbsolutePath
      $ext = [IO.Path]::GetExtension($path).ToLower()

      if (-not (Test-Path $path -PathType Leaf)) {
        # SPA fallback to index.html for extensionless or html routes
        if ([string]::IsNullOrWhiteSpace($ext) -or $ext -eq '.html' -or $ctx.Request.Url.AbsolutePath -eq '/') {
          $fallback = Join-Path $Root 'index.html'
          if (Test-Path $fallback -PathType Leaf) {
            $bytes = [IO.File]::ReadAllBytes($fallback)
            $ctx.Response.ContentType = 'text/html; charset=utf-8'
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
            $ctx.Response.OutputStream.Close()
            continue
          }
        }
        $ctx.Response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
        $ctx.Response.OutputStream.Close()
        continue
      }

      $ctype = $mime[$ext]
      if (-not $ctype) { $ctype = 'application/octet-stream' }
      $bytes = [IO.File]::ReadAllBytes($path)
      $ctx.Response.ContentType = $ctype
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
      $ctx.Response.OutputStream.Close()
    } catch {
      try {
        $ctx.Response.StatusCode = 500
        $err = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
        $ctx.Response.OutputStream.Write($err,0,$err.Length)
        $ctx.Response.OutputStream.Close()
      } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
