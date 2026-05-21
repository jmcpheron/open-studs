// studs/pyramid.scad — classic 4-sided pyramid.
// MIT licensed.
//
// Module contract (see CONTRIBUTING.md):
//   stud_pyramid(size, tip_radius, height)
//   - origin at base center, axis along +Z, base on z=0
//
// LEARNING-MODE NOTE: there are three reasonable ways to build a pyramid in
// OpenSCAD. We use `cylinder($fn=4)` because tip_radius drops in cleanly as
// the top radius. Alternatives if you want to revisit:
//   (a) polyhedron with explicit vertices  — most control, no fillet support
//   (b) hull() over a square base and a point — clean, harder to flatten tip
//   (c) minkowski() of (a) with a small sphere — true fillet, slow render

module stud_pyramid(size = 6, tip_radius = 0.4, height = undef) {
    h = is_undef(height) ? size : height;

    // cylinder $fn=4 produces a 4-sided prism. To make the *corners* sit at
    // x=±size/2 and y=±size/2, the base radius must be (size/2)*sqrt(2).
    base_r = (size / 2) * sqrt(2);
    top_r  = tip_radius > 0 ? tip_radius * sqrt(2) : 0;

    rotate([0, 0, 45])
        cylinder(h = h, r1 = base_r, r2 = top_r, $fn = 4);
}

// development render
stud_pyramid(size = 8, tip_radius = 0.4);
