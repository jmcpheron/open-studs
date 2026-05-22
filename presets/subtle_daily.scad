// presets/subtle_daily.scad — low-key daily-wear bracelet.
// MIT licensed.
//
// Flat pyramid studs in a single row, magnetic clasp for fast on/off, narrow
// (16mm) band, small-adult sizing. The "wear it to work" option.

use <../bracelet.scad>

studded_bracelet(
    circumference = 170,
    width         = 16,
    thickness     = 3,
    stud_module   = "flat_pyramid",
    stud_pattern  = "single_row",
    stud_rows     = 1,
    stud_size     = 5,
    latch         = "magnetic",
    mode          = "integral"
);
