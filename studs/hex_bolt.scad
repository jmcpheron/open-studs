// studs/hex_bolt.scad — hex head, like a real bolt sticking up.
// MIT licensed.
//
// Industrial set. The hex shape is achieved via cylinder($fn=6); tip_radius
// chamfers the top edge.

module stud_hex_bolt(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.5 : height;

    // Hex head: cylinder with 6 facets, sized so the flat-to-flat distance
    // equals `size`.
    r = size / sqrt(3);  // outer radius for flat-to-flat = size

    if (tip_radius > 0) {
        // Chamfer the top edge by minkowski-summing the top portion with a
        // small sphere. Keeps the bottom crisp where it meets the band.
        union() {
            cylinder(h = h - tip_radius, r = r, $fn = 6);
            translate([0, 0, h - tip_radius])
                minkowski() {
                    cylinder(h = 0.01, r = r - tip_radius, $fn = 6);
                    sphere(r = tip_radius, $fn = 16);
                }
        }
    } else {
        cylinder(h = h, r = r, $fn = 6);
    }
}

stud_hex_bolt(size = 8, tip_radius = 0.4);
