// studs/screw_head.scad — flat round disc with a slot. Industrial look.
// MIT licensed.

module stud_screw_head(size = 6, tip_radius = 0.4, height = undef) {
    h         = is_undef(height) ? size * 0.25 : height;
    slot_w    = size * 0.15;
    slot_d    = h * 0.4;
    fillet    = min(tip_radius, h * 0.3);

    difference() {
        // disc with a small chamfered top edge if tip_radius > 0
        if (fillet > 0) {
            minkowski() {
                cylinder(h = h - fillet, r = size / 2 - fillet);
                sphere(r = fillet);
            }
        } else {
            cylinder(h = h, r = size / 2);
        }
        // slot
        translate([-size / 2, -slot_w / 2, h - slot_d])
            cube([size, slot_w, slot_d + 0.1]);
    }
}

stud_screw_head(size = 10, tip_radius = 0.5);
