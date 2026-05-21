// studs/heart.scad — geometric heart.
// MIT licensed.
//
// Festival set. Two overlapping circles for the lobes + a downward triangle
// for the point. The kawaii option; pairs with pastel TPU.

module stud_heart(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.35 : height;
    // Each circle has radius size/4 and sits at the upper-left / upper-right
    // of the bounding box. The triangle apex is at the bottom center.
    lobe_r = size / 4;
    lobe_y =  size / 4;
    lobe_x =  size / 4;

    linear_extrude(height = h)
        union() {
            translate([-lobe_x, lobe_y]) circle(r = lobe_r);
            translate([ lobe_x, lobe_y]) circle(r = lobe_r);
            polygon([
                [-size / 2 - 0.01, lobe_y],
                [ size / 2 + 0.01, lobe_y],
                [ 0,              -size / 2]
            ]);
        }
}

stud_heart(size = 10);
