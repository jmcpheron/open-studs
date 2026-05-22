// latches/loop_post_v2.scad — lower loop/post toggle with a guided keyhole.
// MIT licensed.
//
// Compared with loop_post.scad, this version lowers the post, moves it inboard,
// and gives the loop a large entry hole plus a narrower capture throat.

LOOP2_POST_INSET    = 8;
LOOP2_SHAFT_D       = 4.6;
LOOP2_HEAD_D        = 8.4;
LOOP2_SHAFT_HEIGHT  = 3.0;
LOOP2_HEAD_HEIGHT   = 1.5;
LOOP2_BASE_D        = 9.0;
LOOP2_TAB_LENGTH    = 34;
LOOP2_TAB_WIDTH_FR  = 0.74;
LOOP2_ENTRY_D       = 9.6;
LOOP2_CAPTURE_D     = 5.6;
LOOP2_THROAT_W      = 5.2;
LOOP2_ENTRY_X       = 23;
LOOP2_CAPTURE_X     = 10.5;
LOOP2_RELIEF_D      = 2.2;

module _loop2_round_rect_2d(length, width, radius) {
    offset(r = radius) offset(delta = -radius)
        square([length, width], center = false);
}

module _loop2_post(band_width, band_thickness) {
    translate([LOOP2_POST_INSET, band_width / 2, band_thickness])
        union() {
            cylinder(h = 0.6, d = LOOP2_BASE_D, $fn = 36);
            cylinder(h = LOOP2_SHAFT_HEIGHT, d = LOOP2_SHAFT_D, $fn = 36);
            translate([0, 0, LOOP2_SHAFT_HEIGHT])
                cylinder(
                    h = LOOP2_HEAD_HEIGHT,
                    r1 = LOOP2_SHAFT_D / 2,
                    r2 = LOOP2_HEAD_D / 2,
                    $fn = 36
                );
        }
}

module _loop2_tab(band_width, band_thickness) {
    tab_w = min(band_width * LOOP2_TAB_WIDTH_FR, band_width - 4);
    y0 = (band_width - tab_w) / 2;
    cy = band_width / 2;

    translate([0, y0, 0])
        difference() {
            linear_extrude(height = band_thickness)
                _loop2_round_rect_2d(LOOP2_TAB_LENGTH, tab_w, 3.2);

            translate([LOOP2_ENTRY_X, cy - y0, -0.1])
                cylinder(h = band_thickness + 0.2, d = LOOP2_ENTRY_D, $fn = 40);

            translate([LOOP2_CAPTURE_X, cy - y0, -0.1])
                cylinder(h = band_thickness + 0.2, d = LOOP2_CAPTURE_D, $fn = 32);

            translate([
                LOOP2_CAPTURE_X,
                cy - y0 - LOOP2_THROAT_W / 2,
                -0.1
            ])
                cube([
                    LOOP2_ENTRY_X - LOOP2_CAPTURE_X,
                    LOOP2_THROAT_W,
                    band_thickness + 0.2
                ]);

            for (side = [-1, 1])
                translate([
                    LOOP2_CAPTURE_X - 3.2,
                    cy - y0 + side * (LOOP2_CAPTURE_D / 2 + 2.5),
                    -0.1
                ])
                    cylinder(h = band_thickness + 0.2, d = LOOP2_RELIEF_D, $fn = 18);
        }
}

module latch_loop_post_v2(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both")
        _loop2_post(band_width, band_thickness);

    if (end == "right" || end == "both")
        _loop2_tab(band_width, band_thickness);
}

// development render
translate([0, 0, 0]) cube([70, 22, 3]);
latch_loop_post_v2(22, 3, end = "left");
translate([70, 0, 0]) latch_loop_post_v2(22, 3, end = "right");
