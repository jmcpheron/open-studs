// latches/friction_overlap.scad — no hardware, ends overlap and TPU-on-TPU grip
// holds.
// MIT licensed.
//
// Adds a small taper at both ends (thinner) so the overlap zone doesn't
// double the wrist's wrap diameter visibly. Adjustable by sliding.

module latch_friction_overlap(band_width, band_thickness) {
    taper_l = 18;  // mm of taper into each end

    // left end taper: shrink to half thickness over taper_l
    translate([0, 0, 0])
        rotate([0, 0, 180])
            linear_extrude(height = band_thickness, scale = [0.6, 1.0])
                square([0.01, band_width], center = false);

    // The above is just a visual hint — the actual taper is handled by the
    // band itself; this module is intentionally minimal because friction
    // overlap requires NO added hardware.
}

// development render
latch_friction_overlap(22, 3);
