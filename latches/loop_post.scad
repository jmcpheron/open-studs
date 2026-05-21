// latches/loop_post.scad — loop on one end, post on the other.
// MIT licensed.
//
// STUB. Signature locked; full geometry deferred.

module latch_loop_post(band_width, band_thickness, end = "both") {
    echo("WARN: latch_loop_post is a stub; producing placeholder geometry");
    color("red", 0.4)
        translate([-5, 0, band_thickness])
            cube([10, band_width, 1]);
}

latch_loop_post(22, 3);
