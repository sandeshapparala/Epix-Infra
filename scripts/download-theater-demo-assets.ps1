param([string]$ReferenceRoot = '')
$ErrorActionPreference = 'Stop'
$assetRoot = Join-Path $PSScriptRoot '../public/theater-demo'
$modelsRoot = Join-Path $assetRoot 'models'
New-Item -ItemType Directory -Force -Path $modelsRoot | Out-Null
$files = @(
    @{ Name = '2-chair-row-draco.gltf'; Folder = 'seating' },
    @{ Name = '3-chair-row-draco.gltf'; Folder = 'seating' },
    @{ Name = '4-chair-row-draco.gltf'; Folder = 'seating' },
    @{ Name = '5-chair-row-draco.gltf'; Folder = 'seating' },
    @{ Name = 'projector-no-mount-draco.gltf'; Folder = 'projector' },
    @{ Name = 'all-speakers-draco.gltf'; Folder = 'speakers' },
    @{ Name = 'tv-draco.gltf'; Folder = 'television' }
)
$manifest = @()
foreach ($asset in $files) {
    $source = "https://theaters.audioadvice.com/3dModels/default/$($asset.Folder)/$($asset.Name)"
    $destination = Join-Path $modelsRoot $asset.Name
    $reference = if ($ReferenceRoot) { Join-Path $ReferenceRoot $asset.Name } else { '' }
    if (Test-Path -LiteralPath $destination) {
        # Keep models already retrieved through the browser when HTTP clients are challenged.
    } elseif ($reference -and (Test-Path -LiteralPath $reference)) {
        Copy-Item -LiteralPath $reference -Destination $destination
    } else {
        Invoke-WebRequest -Uri $source -OutFile $destination -TimeoutSec 60
    }
    $model = Get-Content -LiteralPath $destination -Raw | ConvertFrom-Json
    if ($model.asset.version -ne '2.0') { throw "Invalid glTF: $destination" }
    $manifest += [ordered]@{
        file = "models/$($asset.Name)"
        sourceUrl = $source
        bytes = (Get-Item -LiteralPath $destination).Length
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLower()
        meshes = @($model.meshes | ForEach-Object { $_.name })
        requiredExtensions = @($model.extensionsRequired)
        licenseStatus = 'Reuse permission not established. Reference assets for the requested local demonstration.'
    }
    Write-Output "$($asset.Name): $((Get-Item -LiteralPath $destination).Length) bytes; valid glTF 2.0"
}
foreach ($texture in @('carpet-bump-map.jpg', 'background-gradient.jpg')) {
    $textureDestination = Join-Path $assetRoot $texture
    if (!(Test-Path -LiteralPath $textureDestination)) {
        if ($ReferenceRoot -and (Test-Path -LiteralPath (Join-Path $ReferenceRoot $texture))) {
            Copy-Item -LiteralPath (Join-Path $ReferenceRoot $texture) -Destination $textureDestination
        } else {
            Invoke-WebRequest -Uri "https://theaters.audioadvice.com/img/textures/$texture" -OutFile $textureDestination -TimeoutSec 60
        }
    }
}
$decoderRoot = Join-Path $assetRoot 'draco'
New-Item -ItemType Directory -Force -Path $decoderRoot | Out-Null
foreach ($decoderFile in @('draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "../node_modules/three/examples/jsm/libs/draco/gltf/$decoderFile") -Destination $decoderRoot
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../node_modules/three/LICENSE') -Destination (Join-Path $decoderRoot 'THREE-LICENSE.txt')
$textures = @('carpet-bump-map.jpg', 'background-gradient.jpg') | ForEach-Object {
    [ordered]@{ file = $_; sourceUrl = "https://theaters.audioadvice.com/img/textures/$_"; sha256 = (Get-FileHash -LiteralPath (Join-Path $assetRoot $_) -Algorithm SHA256).Hash.ToLower(); licenseStatus = 'Reuse permission not established.' }
}
[ordered]@{ retrievedAt = (Get-Date).ToUniversalTime().ToString('o'); models = $manifest; textures = $textures; decoderSource = 'Installed three package; Draco decoder included with its notices.' } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $assetRoot 'source-manifest.json') -Encoding utf8
