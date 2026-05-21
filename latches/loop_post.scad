// latches/loop_post.scad — loop frame on one end, T-post on the other.
// MIT licensed.
//
// Convention: end="left" places a small T-headed post UP from the band's top
// surface at x=0; end="right" places a loop-frame extending +X past the
// band end. When worn, the loop-frame slips over the T-post and the post's
// head captures it.

LOOP_POST_DIAMETER     = 5;     // mm — post shaft diameter
LOOP_POST_HEIGHT       = 7;     // mm — post total height
LOOP_POST_HEAD_R       = 4;     // mm — T-head radius (wider than shaft so the loop is captured)
LOOP_FRAME_LENGTH      = 18;    // mm — frame extends past band end
LOOP_FRAME_INNER_W     = 8;     // mm — inner cutout width (must clear post head)
LOOP_FRAME_INNER_L     = 10;    // mm — inner cutout length
LOOP_FRAME_WALL        = 2.5;   // mm

module latch_loop_post(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both") {
        // T-headed post centered on the band's top surface near x = 0
        translate([0, band_width / 2, band_thickness]) {
            cylinder(h = LOOP_POST_HEIGHT - 1.2, d = LOOP_POST_DIAMETER);
            translate([0, 0, LOOP_POST_HEIGHT - 1.2])
                cylinder(h = 1.2,
                         r1 = LOOP_POST_DIAMETER / 2,
                         r2 = LOOP_POST_HEAD_R);
        }
    }
    if (end == "right" || end == "both") {
        // Loop frame extending +X past the band end
        frame_w = band_width * 0.8;
        translate([0, (band_width - frame_w) / 2, 0])
            difference() {
                // outer rounded-rect
                linear_extrude(height = band_thickness)
                    offset(r = 3) offset(delta = -3)
                        square([LOOP_FRAME_LENGTH, frame_w]);
                // inner cutout for the loop
                translate([
                    (LOOP_FRAME_LENGTH - LOOP_FRAME_INNER_L) / 2,
                    (frame_w - LOOP_FRAME_INNER_W) / 2,
                    -0.1
                ])
                    linear_extrude(height = band_thickness + 0.2)
                        offset(r = 1.5) offset(delta = -1.5)
                            square([LOOP_FRAME_INNER_L, LOOP_FRAME_INNER_W]);
            }
    }
}

latch_loop_post(22, 3);
