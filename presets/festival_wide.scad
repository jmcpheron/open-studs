// presets/festival_wide.scad — pastel-friendly festival cuff.
// MIT licensed.
//
// Star studs in a double-row pattern, T-post loop closure, wider band (28mm)
// for a more cuff-like silhouette, large adult sizing.

use <../bracelet.scad>

studded_bracelet(
    circumference = 200,
    width         = 28,
    thickness     = 3,
    stud_module   = "star",
    stud_pattern  = "double_row",
    stud_rows     = 2,
    stud_size     = 8,
    latch         = "loop_post",
    mode          = "integral"
);
