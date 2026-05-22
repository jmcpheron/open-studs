// test_prints/latch_lab_ladder_strap.scad — first adjustable ladder coupon.
// MIT licensed.

use <../bracelet.scad>

studded_bracelet(
    circumference = 80,
    width         = 22,
    thickness     = 3,
    latch         = "ladder_strap",
    stage         = "latch_only",
    test_length   = 80
);
