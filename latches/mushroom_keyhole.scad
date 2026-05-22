// latches/mushroom_keyhole.scad — low-profile mushroom post with a keyhole tab.
// MIT licensed.
//
// Closure idea: push the mushroom head through the large entry hole, then pull
// the tab so the shaft slides into the smaller capture hole. TPU stretch keeps
// the narrow throat from releasing accidentally.

MUSHROOM_POST_INSET    = 8;
MUSHROOM_SHAFT_D       = 4.8;
MUSHROOM_HEAD_D        = 8.2;
MUSHROOM_SHAFT_HEIGHT  = 3.4;
MUSHROOM_HEAD_HEIGHT   = 1.6;
MUSHROOM_BASE_D        = 8.8;
MUSHROOM_TAB_LENGTH    = 36;
MUSHROOM_TAB_WIDTH_FR  = 0.68;
MUSHROOM_ENTRY_D       = 9.4;
MUSHROOM_CAPTURE_D     = 5.4;
MUSHROOM_THROAT_W      = 5.1;
MUSHROOM_ENTRY_X       = 12;
MUSHROOM_CAPTURE_X     = 25;

module _mk_round_rect_2d(length, width, radius) {
    offset(r = radius) offset(delta = -radius)
        square([length, width], center = false);
}

module _mushroom_post(band_width, band_thickness) {
    translate([MUSHROOM_POST_INSET, band_width / 2, band_thickness])
        union() {
            cylinder(h = 0.6, d = MUSHROOM_BASE_D, $fn = 36);
            cylinder(h = MUSHROOM_SHAFT_HEIGHT, d = MUSHROOM_SHAFT_D, $fn = 36);
            translate([0, 0, MUSHROOM_SHAFT_HEIGHT])
                cylinder(
                    h = MUSHROOM_HEAD_HEIGHT,
                    r1 = MUSHROOM_SHAFT_D / 2,
                    r2 = MUSHROOM_HEAD_D / 2,
                    $fn = 36
                );
        }
}

module _mushroom_keyhole_tab(band_width, band_thickness) {
    tab_w = min(band_width * MUSHROOM_TAB_WIDTH_FR, band_width - 4);
    y0 = (band_width - tab_w) / 2;
    cy = band_width / 2;

    translate([0, y0, 0])
        difference() {
            linear_extrude(height = band_thickness)
                _mk_round_rect_2d(MUSHROOM_TAB_LENGTH, tab_w, 3);

            translate([MUSHROOM_ENTRY_X, cy - y0, -0.1])
                cylinder(h = band_thickness + 0.2, d = MUSHROOM_ENTRY_D, $fn = 36);

            translate([MUSHROOM_CAPTURE_X, cy - y0, -0.1])
                cylinder(h = band_thickness + 0.2, d = MUSHROOM_CAPTURE_D, $fn = 36);

            translate([
                min(MUSHROOM_ENTRY_X, MUSHROOM_CAPTURE_X),
                cy - y0 - MUSHROOM_THROAT_W / 2,
                -0.1
            ])
                cube([
                    abs(MUSHROOM_ENTRY_X - MUSHROOM_CAPTURE_X),
                    MUSHROOM_THROAT_W,
                    band_thickness + 0.2
                ]);
        }
}

module latch_mushroom_keyhole(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both")
        _mushroom_post(band_width, band_thickness);

    if (end == "right" || end == "both")
        _mushroom_keyhole_tab(band_width, band_thickness);
}

// development render
translate([0, 0, 0]) cube([70, 22, 3]);
latch_mushroom_keyhole(22, 3, end = "left");
translate([70, 0, 0]) latch_mushroom_keyhole(22, 3, end = "right");
