$dir = "C:\Users\nurre\.gemini\antigravity-ide\scratch\teknoradar-tools"
$html = Get-Content "$dir\index.html" -Raw
$css = Get-Content "$dir\style.css" -Raw
$app = Get-Content "$dir\app-core.js" -Raw
$data = Get-Content "$dir\education-data.js" -Raw
$ui = Get-Content "$dir\education-ui.js" -Raw

$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>`n$css`n</style>")
$scriptTags = @"
<script src="app-core.js"></script>
<script src="education-data.js"></script>
<script src="education-ui.js"></script>
"@
$inlineScript = "<script>`n$app`n$data`n$ui`n</script>"
$html = $html.Replace($scriptTags, $inlineScript)

Set-Content -Path "$dir\standalone.html" -Value $html -Encoding UTF8
Write-Output "Done! standalone.html generated."
