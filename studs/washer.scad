// studs/washer.scad — flat ring with a through-hole.
// MIT licensed.
//
// Industrial set. The "negative space" stud — when massed, reads as a row of
// loose washers riveted to the band. Pairs especially well with multi-color
// prints where the hole exposes a different layer color.

module stud_washer(size = 6, tip_radius = 0.4, height = undef) {
    h        = is_undef(height) ? size * 0.25 : height;
    outer_r  = size / 2;
    inner_r  = size * 0.30;
    fillet   = min(tip_radius, h * 0.4);

    difference() {
        if (fillet > 0) {
            minkowski() {
                cylinder(h = max(h - fillet, 0.01), r = outer_r - fillet);
                sphere(r = fillet, $fn = 16);
            }
        } else {
            cylinder(h = h, r = outer_r);
        }
        // through-hole; small overlap so the boolean is clean
        translate([0, 0, -0.1])
            cylinder(h = h + 0.2, r = inner_r);
    }
}

stud_washer(size = 10);
