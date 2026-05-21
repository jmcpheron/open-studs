// studs/lightning.scad — zigzag bolt.
// MIT licensed.
//
// Festival/cyberpunk set. A flash-of-lightning silhouette extruded low.

module stud_lightning(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size * 0.35 : height;
    // 6-point polygon making a stylized bolt; coords scaled to fit
    // within [-size/2, size/2] in both axes.
    s = size / 2;
    points = [
        [-0.15 * s,  1.00 * s],
        [ 0.55 * s,  0.10 * s],
        [ 0.05 * s,  0.10 * s],
        [ 0.45 * s, -1.00 * s],
        [-0.35 * s, -0.10 * s],
        [ 0.10 * s, -0.10 * s],
    ];

    if (tip_radius > 0) {
        linear_extrude(height = h)
            offset(r = tip_radius)
                offset(delta = -tip_radius)
                    polygon(points);
    } else {
        linear_extrude(height = h)
            polygon(points);
    }
}

stud_lightning(size = 12);
