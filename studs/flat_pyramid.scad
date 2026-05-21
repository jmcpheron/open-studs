// studs/flat_pyramid.scad — low-profile pyramid for daily wear.
// MIT licensed.
//
// Same geometry as `stud_pyramid` but ~40% of the height — sits closer to
// the band so it doesn't catch on clothing.

use <pyramid.scad>

module stud_flat_pyramid(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.4 : height;
    stud_pyramid(size = size, tip_radius = tip_radius, height = h);
}

stud_flat_pyramid(size = 8, tip_radius = 0.4);
