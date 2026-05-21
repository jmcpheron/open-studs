// studs/cone_spike.scad — round-base cone spike.
// MIT licensed.

module stud_cone_spike(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 1.2 : height;
    cylinder(h = h, r1 = size / 2, r2 = max(tip_radius, 0.001));
}

stud_cone_spike(size = 8, tip_radius = 0.4);
