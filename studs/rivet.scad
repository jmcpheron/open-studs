// studs/rivet.scad — rounded button rivet, like a tiny mushroom cap.
// MIT licensed.
//
// Industrial set. Looks like a smashed-flat ball bearing. Low profile,
// reads as "loose hardware" in mass on a band.

module stud_rivet(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.4 : height;

    // Body: short cylinder with a domed top. The dome is half a flattened
    // sphere intersected with the cap region so it doesn't peak too high.
    cyl_h = h * 0.6;
    dome_h = h * 0.4;

    union() {
        cylinder(h = cyl_h, r = size / 2);
        translate([0, 0, cyl_h]) {
            intersection() {
                scale([1, 1, dome_h / (size / 2)])
                    sphere(r = size / 2, $fn = 32);
                cylinder(h = dome_h, r = size / 2);
            }
        }
    }
}

stud_rivet(size = 8);
