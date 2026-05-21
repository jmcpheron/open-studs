// studs/long_spike.scad — the dramatic one.
// MIT licensed.
//
// Tall cone spike. ~2.5x size by default. Set tip_radius = 0 for the full
// "do not approach me at the show" aesthetic, ~0.4 for "I'd like to keep my
// eye."

module stud_long_spike(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 2.5 : height;
    cylinder(h = h, r1 = size / 2, r2 = max(tip_radius, 0.001));
}

stud_long_spike(size = 8, tip_radius = 0.4);
