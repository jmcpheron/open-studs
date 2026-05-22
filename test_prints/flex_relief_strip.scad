// test_prints/flex_relief_strip.scad — thick-band underside relief coupon.
// MIT licensed. See LICENSE-MIT.

use <../bracelet.scad>

studded_bracelet(
    circumference   = 80,
    width           = 28,
    thickness       = 5,
    latch           = "none",
    mode            = "integral",
    flex_relief     = "inside_slots",
    relief_pitch    = 8,
    relief_width    = 1.2,
    relief_depth    = 3.8,
    latch_clearance = 8,
    stage           = "band_only"
);
