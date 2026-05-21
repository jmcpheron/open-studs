// latches/snap.scad — printed peg-and-socket snap closure.
// MIT licensed.
//
// Convention: end="left" extends in -X from origin; end="right" extends in +X.
// Caller places at x=0 for left and translates to band_length for right.
//
// Both ends have a flat tab extending past the band edge. The LEFT tab has
// a small peg pointing up; the RIGHT tab has a matching socket on its
// underside. When worn, the right tab lays on top of the left tab and the
// peg snaps into the socket.

SNAP_TAB_LENGTH    = 14;   // mm — how far the tab extends past the band
SNAP_PEG_DIAMETER  = 4;    // mm
SNAP_PEG_HEIGHT    = 2.5;  // mm — pegs head sticks above the tab top
SNAP_PEG_HEAD_R    = 2.6;  // mm — flared head, slightly wider than the shaft

module _snap_tab(band_width, band_thickness, direction) {
    // direction = -1 for left (extends -X) or +1 for right (extends +X)
    tab_w = band_width * 0.7;
    x0 = direction == -1 ? -SNAP_TAB_LENGTH : 0;
    translate([x0, (band_width - tab_w) / 2, 0])
        linear_extrude(height = band_thickness)
            offset(r = 3) offset(delta = -3)
                square([SNAP_TAB_LENGTH, tab_w]);
}

module latch_snap(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both") {
        // tab extends -X
        _snap_tab(band_width, band_thickness, direction = -1);
        // peg pointing up at the tab's tip
        translate([-SNAP_TAB_LENGTH * 0.65, band_width / 2, band_thickness])
            union() {
                cylinder(h = SNAP_PEG_HEIGHT * 0.7, d = SNAP_PEG_DIAMETER);
                translate([0, 0, SNAP_PEG_HEIGHT * 0.7])
                    cylinder(h = SNAP_PEG_HEIGHT * 0.3,
                             r1 = SNAP_PEG_DIAMETER / 2,
                             r2 = SNAP_PEG_HEAD_R);
            }
    }
    if (end == "right" || end == "both") {
        // tab extends +X, with a socket cavity in the underside at the tip
        difference() {
            _snap_tab(band_width, band_thickness, direction = +1);
            // socket: cylindrical cavity sized slightly larger than the peg
            // head, opening downward from z=0 (underside of the tab)
            translate([SNAP_TAB_LENGTH * 0.65, band_width / 2, -0.01])
                cylinder(h = band_thickness * 0.7,
                         d = SNAP_PEG_HEAD_R * 2 + 0.4);
        }
    }
}

latch_snap(22, 3);
