"""Parameter mirror — every dimension that has a default in the .scad files
also lives here as a Python constant.

This file is the single source of truth for documentation. The `.scad` files
are the single source of truth for geometry. They must stay in sync; the
drift test in `tests/test_no_drift.py` (added in Push 2) will fail if a
number in `params.py` disagrees with the markdown that cites it.

All units are millimeters unless otherwise noted.
"""

# --- band defaults ----------------------------------------------------------

BAND_DEFAULT_CIRCUMFERENCE = 180   # medium-adult wrist; see SIZING below
BAND_DEFAULT_WIDTH         = 22
BAND_DEFAULT_THICKNESS     = 3
BAND_CORNER_RADIUS         = 4
LATCH_MARGIN               = 25    # mm reserved at each end for latch hardware

# --- sizing reference -------------------------------------------------------
# Circumference ranges by wrist size, in mm. From README.md.
SIZING = {
    "kid":          (140, 160),
    "small_adult":  (160, 180),
    "medium_adult": (175, 195),
    "large_adult":  (190, 215),
}

# --- stud defaults ----------------------------------------------------------

STUD_DEFAULT_SIZE        = 6     # base width/diameter
STUD_DEFAULT_TIP_RADIUS  = 0.4   # safety-rounded; set to 0 for sharp
STUD_DEFAULT_ROWS        = 1

# Per-stud height multipliers (relative to STUD_DEFAULT_SIZE).
STUD_HEIGHT_MULTIPLIERS = {
    "pyramid":      1.0,
    "dome":         0.5,
    "cone_spike":   1.2,
    "long_spike":   2.5,
    "diamond":      1.4,
    "flat_pyramid": 0.4,
    "screw_head":   0.25,
}

# --- buckle latch defaults --------------------------------------------------

BUCKLE_HOLES          = 5     # adjustment holes
BUCKLE_HOLE_SPACING   = 5     # mm center-to-center
BUCKLE_HOLE_DIAMETER  = 3.5
BUCKLE_PIN_DIAMETER   = 3.2   # slightly under hole, for friction fit
BUCKLE_FRAME_LENGTH   = 12
BUCKLE_TONGUE_LENGTH  = 35

# --- single_row pattern defaults --------------------------------------------

SINGLE_ROW_DEFAULT_SPACING = 12   # mm center-to-center; auto-fits to band

# --- double_row pattern defaults --------------------------------------------

DOUBLE_ROW_DEFAULT_SPACING = 12
DOUBLE_ROW_INSET           = 0.28  # fraction of band_width

# --- staggered pattern defaults ---------------------------------------------

STAGGERED_DEFAULT_SPACING = 12
STAGGERED_INSET           = 0.28

# --- TPU printing recommendations (from README.md) --------------------------

TPU_RECOMMENDED_SHORE = "95A"
LAYER_HEIGHT_DEFAULT  = 0.2   # mm
LAYER_HEIGHT_FINE     = 0.15
PRINT_SPEED_MAX_MMS   = 30
