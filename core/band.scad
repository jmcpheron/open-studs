// core/band.scad — bracelet substrate geometry.
// MIT licensed. See LICENSE-MIT.

include <config.scad>

// --- flat printable substrate ---------------------------------------------

module band_strip(length, width, thickness, corner = OPEN_STUDS_DEFAULT_CORNER) {
    linear_extrude(height = thickness)
        if (corner > 0)
            offset(r = corner) offset(delta = -corner)
                square([length, width], center = false);
        else
            square([length, width], center = false);
}

function band_relief_enabled(mode, thickness) =
    mode == "inside_slots" || mode == "slots" ||
    (mode == "auto" && thickness >= 3.6);

function band_relief_depth(thickness, relief_depth) =
    max(0, min(
        thickness - 0.6,
        is_undef(relief_depth) ? max(0, thickness - 1.2) : relief_depth
    ));

module band_flex_relief_cuts(
    length,
    width,
    thickness,
    relief_pitch       = 10,
    relief_width       = 1.2,
    relief_depth       = undef,
    relief_edge_margin = 2,
    relief_margin      = OPEN_STUDS_LATCH_MARGIN
) {
    depth = band_relief_depth(thickness, relief_depth);
    slot_y = relief_edge_margin;
    slot_width = max(0, width - 2 * relief_edge_margin);

    if (relief_pitch > 0 && relief_width > 0 && depth > 0 && slot_width > 0)
        for (x = [relief_margin : relief_pitch : length - relief_margin])
            translate([x - relief_width / 2, slot_y, -0.05])
                cube([relief_width, slot_width, depth + 0.1], center = false);
}

module bracelet_band(
    length,
    width,
    thickness,
    corner             = OPEN_STUDS_DEFAULT_CORNER,
    flex_relief        = "none",
    relief_pitch       = 10,
    relief_width       = 1.2,
    relief_depth       = undef,
    relief_edge_margin = 2,
    relief_margin      = OPEN_STUDS_LATCH_MARGIN
) {
    difference() {
        band_strip(length, width, thickness, corner);

        if (band_relief_enabled(flex_relief, thickness))
            band_flex_relief_cuts(
                length,
                width,
                thickness,
                relief_pitch,
                relief_width,
                relief_depth,
                relief_edge_margin,
                relief_margin
            );
    }
}

module bracelet_band_from_config(cfg) {
    bracelet_band(
        length             = band_cfg_length(cfg),
        width              = band_cfg_width(cfg),
        thickness          = band_cfg_thickness(cfg),
        corner             = band_cfg_corner(cfg),
        flex_relief        = band_cfg_flex_relief(cfg),
        relief_pitch       = band_cfg_relief_pitch(cfg),
        relief_width       = band_cfg_relief_width(cfg),
        relief_depth       = band_cfg_relief_depth(cfg),
        relief_edge_margin = band_cfg_relief_edge_margin(cfg),
        relief_margin      = band_cfg_relief_margin(cfg)
    );
}
