Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$leanExe = Join-Path $env:USERPROFILE '.elan\bin\lean.exe'
if (-not (Test-Path -LiteralPath $leanExe)) {
  throw "Lean executable not found: $leanExe"
}

$leanRoots = @(
  'F:\MathResearchDB_v0_4\lean_cache\oai_workspace',
  'F:\MathResearchDB_v0_4\lean_cache\packages\Cli\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\batteries\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\Qq\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\aesop\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\proofwidgets\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\importGraph\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\LeanSearchClient\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\packages\plausible\.lake\build\lib\lean',
  'F:\MathResearchDB_v0_4\lean_cache\mathlib\.lake\build\lib\lean',
  (Join-Path $env:USERPROFILE '.elan\toolchains\leanprover--lean4---v4.34.1\lib\lean')
)

$missingRoots = @($leanRoots | Where-Object { -not (Test-Path -LiteralPath $_) })
$requiredRoots = @(
  'F:\MathResearchDB_v0_4\lean_cache\mathlib\.lake\build\lib\lean',
  (Join-Path $env:USERPROFILE '.elan\toolchains\leanprover--lean4---v4.34.1\lib\lean')
)
$missingRequiredRoots = @($requiredRoots | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missingRequiredRoots.Count -gt 0) {
  throw "Required Lean roots are missing:`n$($missingRequiredRoots -join "`n")"
}

$existingRoots = @($leanRoots | Where-Object { Test-Path -LiteralPath $_ })
$env:LEAN_PATH = $existingRoots -join ';'
$formalFiles = @(
  (Join-Path $PSScriptRoot 'SubQGDerivation.lean'),
  (Join-Path $PSScriptRoot 'SubQGUniverseEvolution.lean'),
  (Join-Path (Split-Path $PSScriptRoot -Parent) 'docs\SubQG_Formal_Verification_2026-11-11.lean')
)

foreach ($formalFile in $formalFiles) {
  if (-not (Test-Path -LiteralPath $formalFile)) {
    throw "Lean source not found: $formalFile"
  }
  $sourceText = Get-Content -LiteralPath $formalFile -Raw
  if ($sourceText -match '(?i)\b(sorry|admit|sorryAx)\b') {
    throw "Forbidden proof shortcut found in source: $formalFile"
  }

  Write-Output "Verifying: $formalFile"
  $compilerOutput = & $leanExe $formalFile 2>&1
  $exitCode = $LASTEXITCODE
  $compilerOutput | ForEach-Object { Write-Output $_ }

  if ($exitCode -ne 0) {
    throw "Lean verification failed for $formalFile with exit code $exitCode"
  }

  $joinedOutput = $compilerOutput -join "`n"
  if ($joinedOutput -match 'sorryAx|declaration uses.*sorry|declaration uses.*admit') {
    throw "Lean reported a forbidden proof shortcut in $formalFile"
  }
}

Write-Output "SubQG formal verification: PASSED ($($formalFiles.Count) files)"
