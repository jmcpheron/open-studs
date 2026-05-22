// test_prints/latch_sampler.scad — short latch coupons for fit checks.
// MIT licensed. See LICENSE-MIT.

use <../bracelet.scad>

sample_length = 70;
sample_width = 22;
sample_thickness = 3;

module latch_coupon(name) {
    studded_bracelet(
        circumference = sample_length,
        width         = sample_width,
        thickness     = sample_thickness,
        latch         = name,
        stage         = "latch_only",
        test_length   = sample_length
    );
}

latch_coupon("buckle");

translate([0, 36, 0])
    latch_coupon("loop_post");

translate([0, 72, 0])
    latch_coupon("snap");

translate([0, 108, 0])
    latch_coupon("magnetic");
