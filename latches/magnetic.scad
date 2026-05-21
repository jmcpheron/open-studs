// latches/magnetic.scad — small puck on each band end holding a glued-in
// 6 mm × 2 mm neodymium disc magnet.
// MIT licensed.
//
// Convention: end="left" places a puck at origin extending +X into the band
// (centered at MAGNET_POCKET_INSET from x=0); end="right" places a puck
// extending -X from origin (centered at -MAGNET_POCKET_INSET). The caller
// translates the right invocation to band_length so it sits inside the band's
// right end.
//
// Print orientation: pocket opens UP (toward +Z) so the magnet drops in from
// above. The user glues with cyanoacrylate. Polarity is the user's
// responsibility — mark each magnet before gluing because you cannot reverse
// it once cured.

MAGNET_DIAMETER     = 6;     // mm
MAGNET_THICKNESS    = 2;     // mm
MAGNET_TOLERANCE    = 0.3;   // mm of slack so the magnet drops in cleanly
MAGNET_PUCK_R       = 5.5;   // mm — puck around the pocket
MAGNET_PUCK_HEIGHT  = 2.6;   // mm above the band
MAGNET_PUCK_INSET   = 8;     // mm — puck center from the band end

module _magnet_puck(band_thickness) {
    // puck sits ON TOP of the band at z = band_thickness, with a downward-
    // opening cylinder removed for the magnet (opening on the puck's TOP face
    // because the puck sits proud of the band — the pocket can open up
    // without breaching the band).
    difference() {
        translate([0, 0, band_thickness])
            cylinder(h = MAGNET_PUCK_HEIGHT, r = MAGNET_PUCK_R);
        // pocket opens at the top of the puck, sunk down to leave a thin floor
        floor_thickness = max(MAGNET_PUCK_HEIGHT - MAGNET_THICKNESS, 0.4);
        translate([0, 0, band_thickness + floor_thickness])
            cylinder(h = MAGNET_THICKNESS + 0.1,
                     d = MAGNET_DIAMETER + MAGNET_TOLERANCE);
    }
}

module latch_magnetic(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both") {
        translate([MAGNET_PUCK_INSET, band_width / 2, 0])
            _magnet_puck(band_thickness);
    }
    if (end == "right" || end == "both") {
        translate([-MAGNET_PUCK_INSET, band_width / 2, 0])
            _magnet_puck(band_thickness);
    }
}

latch_magnetic(22, 3);
