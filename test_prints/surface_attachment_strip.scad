// test_prints/surface_attachment_strip.scad — compare surface attachment modes.
// MIT licensed. See LICENSE-MIT.

use <../bracelet.scad>

// Integral studs.
studded_bracelet(
    circumference   = 80,
    width           = 18,
    thickness       = 3,
    stud_module     = "pyramid",
    stud_pattern    = "single_row",
    stud_size       = 6,
    latch           = "none",
    latch_clearance = 8,
    mode            = "integral",
    stage           = "surface_only"
);

// Modular sockets.
translate([0, 28, 0])
    studded_bracelet(
        circumference   = 80,
        width           = 18,
        thickness       = 3,
        stud_module     = "pyramid",
        stud_pattern    = "single_row",
        stud_size       = 6,
        latch           = "none",
        latch_clearance = 8,
        mode            = "modular",
        stage           = "surface_only"
    );

// Through-holes for third-party hardware.
translate([0, 56, 0])
    studded_bracelet(
        circumference   = 80,
        width           = 18,
        thickness       = 3,
        stud_module     = "pyramid",
        stud_pattern    = "single_row",
        stud_size       = 6,
        latch           = "none",
        latch_clearance = 8,
        mode            = "bare_with_holes",
        stage           = "surface_only"
    );
