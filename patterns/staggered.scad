// patterns/staggered.scad — two rows offset by half a step. The classic
// double-row punk look.
// MIT licensed.

LATCH_MARGIN = 25;
STAGGERED_DEFAULT_SPACING = 12;
STAGGERED_INSET = 0.28;

function _staggered_spacing(band_length, spacing) =
    is_undef(spacing) ?
        (band_length - 2 * LATCH_MARGIN) /
            max(1, floor((band_length - 2 * LATCH_MARGIN) / STAGGERED_DEFAULT_SPACING))
        : spacing;

function _staggered_count(band_length, spacing) =
    floor((band_length - 2 * LATCH_MARGIN) / _staggered_spacing(band_length, spacing)) + 1;

function pattern_staggered(band_length, band_width, rows = 2, spacing = undef) =
    let (
        s  = _staggered_spacing(band_length, spacing),
        n  = _staggered_count(band_length, spacing),
        half = s / 2,
        y1 = band_width * (0.5 - STAGGERED_INSET),
        y2 = band_width * (0.5 + STAGGERED_INSET)
    )
    concat(
        [ for (i = [0 : n - 1]) [LATCH_MARGIN + i * s, y1] ],
        [ for (i = [0 : n - 2]) [LATCH_MARGIN + half + i * s, y2] ]
    );
