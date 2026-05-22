// test_prints/latch_lab_loop_post_v2.scad — lower guided loop/post coupon.
// MIT licensed.

use <../bracelet.scad>

studded_bracelet(
    circumference = 76,
    width         = 22,
    thickness     = 3,
    latch         = "loop_post_v2",
    stage         = "latch_only",
    test_length   = 76
);
