// test_prints/latch_lab_mushroom_keyhole.scad — first mushroom/keyhole coupon.
// MIT licensed.

use <../bracelet.scad>

studded_bracelet(
    circumference = 76,
    width         = 22,
    thickness     = 3,
    latch         = "mushroom_keyhole",
    stage         = "latch_only",
    test_length   = 76
);
