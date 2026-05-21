// patterns/double_row.scad — two parallel rows, evenly spaced.
// MIT licensed.

LATCH_MARGIN = 25;
DOUBLE_ROW_DEFAULT_SPACING = 12;
DOUBLE_ROW_INSET = 0.28;  // fraction of band width to inset each row from center

function _double_row_spacing(band_length, spacing) =
    is_undef(spacing) ?
        (band_length - 2 * LATCH_MARGIN) /
            max(1, floor((band_length - 2 * LATCH_MARGIN) / DOUBLE_ROW_DEFAULT_SPACING))
        : spacing;

function _double_row_count(band_length, spacing) =
    floor((band_length - 2 * LATCH_MARGIN) / _double_row_spacing(band_length, spacing)) + 1;

function pattern_double_row(band_length, band_width, rows = 2, spacing = undef) =
    let (
        s = _double_row_spacing(band_length, spacing),
        n = _double_row_count(band_length, spacing),
        y1 = band_width * (0.5 - DOUBLE_ROW_INSET),
        y2 = band_width * (0.5 + DOUBLE_ROW_INSET)
    )
    concat(
        [ for (i = [0 : n - 1]) [LATCH_MARGIN + i * s, y1] ],
        [ for (i = [0 : n - 1]) [LATCH_MARGIN + i * s, y2] ]
    );
