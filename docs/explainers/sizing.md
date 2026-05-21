# Sizing guide

> Auto-generated from `src/open_studs/params.py`. Do not edit by hand —
> change the numbers in `params.py` and rebuild.

Wrist circumference ranges:

| Wearer | Range |
|---|---|
| Kid | 140–160 mm |
| Small Adult | 160–180 mm |
| Medium Adult | 175–195 mm |
| Large Adult | 190–215 mm |

Defaults shipped in `bracelet.scad`:

- `circumference = 180 mm` (medium adult)
- `width         = 22 mm`
- `thickness     = 3 mm`

Always print [`sizing_test.scad`](../../sizing_test.scad) before committing
to a full bracelet. TPU stretch varies by brand.
