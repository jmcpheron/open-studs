// latches/ladder_strap.scad — adjustable ladder slots over a low catch.
// MIT licensed.
//
// Closure idea: stretch one of the ladder slots over the low catch block.
// This trades elegance for easy adjustability and fast print-test feedback.

LADDER_CATCH_INSET    = 8;
LADDER_CATCH_L        = 5.0;
LADDER_CATCH_HEIGHT   = 2.4;
LADDER_TAB_LENGTH     = 48;
LADDER_TAB_WIDTH_FR   = 0.58;
LADDER_SLOT_COUNT     = 6;
LADDER_SLOT_START_X   = 9;
LADDER_SLOT_SPACING   = 6.2;
LADDER_SLOT_L         = 3.8;
LADDER_SLOT_W         = 10.8;

module _ladder_round_rect_2d(length, width, radius) {
    offset(r = radius) offset(delta = -radius)
        square([length, width], center = false);
}

module _ladder_catch(band_width, band_thickness) {
    catch_w = min(LADDER_SLOT_W - 1.0, band_width - 6);
    translate([
        LADDER_CATCH_INSET - LADDER_CATCH_L / 2,
        (band_width - catch_w) / 2,
        band_thickness
    ])
        linear_extrude(height = LADDER_CATCH_HEIGHT)
            _ladder_round_rect_2d(LADDER_CATCH_L, catch_w, 1.4);
}

module _ladder_tab(band_width, band_thickness) {
    tab_w = min(band_width * LADDER_TAB_WIDTH_FR, band_width - 5);
    y0 = (band_width - tab_w) / 2;
    slot_w = min(LADDER_SLOT_W, tab_w - 2.2);

    translate([0, y0, 0])
        difference() {
            linear_extrude(height = band_thickness)
                _ladder_round_rect_2d(LADDER_TAB_LENGTH, tab_w, 3);

            for (i = [0 : LADDER_SLOT_COUNT - 1])
                translate([
                    LADDER_SLOT_START_X + i * LADDER_SLOT_SPACING - LADDER_SLOT_L / 2,
                    (tab_w - slot_w) / 2,
                    -0.1
                ])
                    linear_extrude(height = band_thickness + 0.2)
                        _ladder_round_rect_2d(LADDER_SLOT_L, slot_w, 1.2);
        }
}

module latch_ladder_strap(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both")
        _ladder_catch(band_width, band_thickness);

    if (end == "right" || end == "both")
        _ladder_tab(band_width, band_thickness);
}

// development render
translate([0, 0, 0]) cube([70, 22, 3]);
latch_ladder_strap(22, 3, end = "left");
translate([70, 0, 0]) latch_ladder_strap(22, 3, end = "right");
