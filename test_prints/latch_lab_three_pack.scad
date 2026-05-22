// test_prints/latch_lab_three_pack.scad — side-by-side latch lab coupons.
// MIT licensed.

use <../bracelet.scad>

sample_width = 22;
sample_thickness = 3;
sample_gap = 36;

module coupon(name, length = 76) {
    studded_bracelet(
        circumference = length,
        width         = sample_width,
        thickness     = sample_thickness,
        latch         = name,
        stage         = "latch_only",
        test_length   = length
    );
}

coupon("mushroom_keyhole", 76);

translate([0, sample_gap, 0])
    coupon("ladder_strap", 80);

translate([0, sample_gap * 2, 0])
    coupon("loop_post_v2", 76);
