$f = "js/module-interventions.js"
Copy-Item $f "$f.bak" -Force
$lines = [System.Collections.Generic.List[string]](Get-Content $f)
function FindLine($pattern, $startIdx) {
    for ($i = $startIdx; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) { return $i }
    }
    return -1
}
$idx = FindLine 'id="intType"' 0
$sel = FindLine '^\s*</select>' ($idx + 1)
if ($sel -ge 0) { $lines.Insert($sel + 1, '                </div>') }
$idx = FindLine 'id="intPriorite"' 0
$sel = FindLine '^\s*</select>' ($idx + 1)
$div = FindLine '^\s*</div>' ($sel + 1)
if ($div -ge 0) { $lines.Insert($div + 1, '              </div>') }
$idx = FindLine 'id="intStatut"' 0
$sel = FindLine '^\s*</select>' ($idx + 1)
$div = FindLine '^\s*</div>' ($sel + 1)
if ($div -ge 0) { $lines.Insert($div + 1, '              </div>') }
[System.IO.File]::WriteAllLines((Resolve-Path $f).Path, $lines, [System.Text.UTF8Encoding]::new($false))
$c = Get-Content js/module-interventions.js
$s = ($c | Select-String 'id="interventionFormModal"').LineNumber[0]
$e = ($c | Select-String 'id="interventionDetailModal"').LineNumber[0]
$z = $c[($s-1)..($e-1)] -join "`n"
$o2 = ([regex]::Matches($z, '<div')).Count
$f2 = ([regex]::Matches($z, '</div>')).Count
$out = "Ouvrants: $o2 / Fermants: $f2`n"
if ($o2 -eq $f2) { $out += "EQUILIBRE OK" } else { $out += "MANQUE $($o2-$f2)" }
$out
