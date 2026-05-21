// studs/star.scad — 5-pointed star.
// MIT licensed.
//
// Festival set. Polygon star linear_extruded to a low profile. `tip_radius`
// softens the tips so they don't stab through clothing.

module stud_star(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.35 : height;
    outer_r = size / 2;
    // 5-point star: alternating outer/inner radii at 10 angles.
    inner_r = outer_r * 0.42;
    points = [
        for (i = [0 : 9]) let (
            angle = i * 36 - 90,         // start pointing up
            r = (i % 2 == 0) ? outer_r : inner_r
        ) [r * cos(angle), r * sin(angle)]
    ];

    if (tip_radius > 0) {
        // Round the tips by offsetting in and back out.
        linear_extrude(height = h)
            offset(r = tip_radius)
                offset(delta = -tip_radius)
                    polygon(points);
    } else {
        linear_extrude(height = h)
            polygon(points);
    }
}

stud_star(size = 10);
