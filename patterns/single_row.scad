// patterns/single_row.scad — evenly-spaced studs along the centerline.
// MIT licensed.
//
// LEARNING-MODE NOTE: spacing strategy is a UX call. We auto-fit: pick the
// number of studs that fits with at least 25 mm of margin at each end (for
// the latch), spaced evenly. Alternative: fixed mm spacing, accept the
// leftover gap. To switch, set `spacing` explicitly when calling.

LATCH_MARGIN              = 25;  // mm at each end
SINGLE_ROW_DEFAULT_SPACING = 12; // mm — used when auto-fit yields nothing

function _single_row_spacing(band_length, spacing) =
    is_undef(spacing) ?
        // auto-fit: aim for ~12 mm spacing, round to fit cleanly
        (band_length - 2 * LATCH_MARGIN) /
            max(1, floor((band_length - 2 * LATCH_MARGIN) / SINGLE_ROW_DEFAULT_SPACING))
        : spacing;

function _single_row_count(band_length, spacing) =
    floor((band_length - 2 * LATCH_MARGIN) / _single_row_spacing(band_length, spacing)) + 1;

function pattern_single_row(band_length, band_width, rows = 1, spacing = undef) =
    let (
        s = _single_row_spacing(band_length, spacing),
        n = _single_row_count(band_length, spacing),
        y = band_width / 2
    )
    [ for (i = [0 : n - 1]) [LATCH_MARGIN + i * s, y] ];
