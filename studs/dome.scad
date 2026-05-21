// studs/dome.scad — half-sphere stud.
// MIT licensed.

module stud_dome(size = 6, tip_radius = 0.4, height = undef) {
    // `size` is the base diameter; `tip_radius` is unused for a dome
    // (the dome is naturally rounded). `height` defaults to a half-sphere.
    r = size / 2;
    h = is_undef(height) ? r : height;

    intersection() {
        sphere(r = r);
        translate([-r, -r, 0]) cube([size, size, h]);
    }
}

stud_dome(size = 8);
