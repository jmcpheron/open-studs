// studs/diamond.scad — bipyramid (two pyramids base-to-base).
// MIT licensed.
//
// The widest cross-section sits halfway up; tip and base are both points
// (or flattened by tip_radius). Reads more "gem" than "punk" — both have
// their moments.

module stud_diamond(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 1.4 : height;
    base_r = (size / 2) * sqrt(2);
    top_r  = tip_radius > 0 ? tip_radius * sqrt(2) : 0;

    rotate([0, 0, 45])
        union() {
            // lower half: point at z=0, widest at z=h/2
            cylinder(h = h / 2, r1 = top_r, r2 = base_r, $fn = 4);
            // upper half: widest at z=h/2, point at z=h
            translate([0, 0, h / 2])
                cylinder(h = h / 2, r1 = base_r, r2 = top_r, $fn = 4);
        }
}

stud_diamond(size = 8, tip_radius = 0.4);
