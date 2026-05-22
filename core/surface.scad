// core/surface.scad — top-side design and attachment cutouts.
// MIT licensed. See LICENSE-MIT.

include <config.scad>

use <../studs/pyramid.scad>
use <../studs/dome.scad>
use <../studs/cone_spike.scad>
use <../studs/long_spike.scad>
use <../studs/diamond.scad>
use <../studs/flat_pyramid.scad>
use <../studs/screw_head.scad>
use <../studs/rivet.scad>
use <../studs/hex_bolt.scad>
use <../studs/washer.scad>
use <../studs/star.scad>
use <../studs/heart.scad>
use <../studs/lightning.scad>

use <../patterns/single_row.scad>
use <../patterns/double_row.scad>
use <../patterns/staggered.scad>
use <../patterns/cluster.scad>
use <../patterns/gradient_size.scad>

// --- dispatch --------------------------------------------------------------

module place_stud(name, size, tip_radius) {
    if      (name == "pyramid")       stud_pyramid(size, tip_radius);
    else if (name == "dome")          stud_dome(size, tip_radius);
    else if (name == "cone_spike")    stud_cone_spike(size, tip_radius);
    else if (name == "long_spike")    stud_long_spike(size, tip_radius);
    else if (name == "diamond")       stud_diamond(size, tip_radius);
    else if (name == "flat_pyramid")  stud_flat_pyramid(size, tip_radius);
    else if (name == "screw_head")    stud_screw_head(size, tip_radius);
    else if (name == "rivet")         stud_rivet(size, tip_radius);
    else if (name == "hex_bolt")      stud_hex_bolt(size, tip_radius);
    else if (name == "washer")        stud_washer(size, tip_radius);
    else if (name == "star")          stud_star(size, tip_radius);
    else if (name == "heart")         stud_heart(size, tip_radius);
    else if (name == "lightning")     stud_lightning(size, tip_radius);
    else echo(str("WARN: unknown stud_module '", name, "'"));
}

function pattern_positions(name, band_length, band_width, rows, spacing) =
      name == "single_row"    ? pattern_single_row(band_length, band_width, rows, spacing)
    : name == "double_row"    ? pattern_double_row(band_length, band_width, rows, spacing)
    : name == "staggered"     ? pattern_staggered(band_length, band_width, rows, spacing)
    : name == "cluster"       ? pattern_cluster(band_length, band_width, rows, spacing)
    : name == "gradient_size" ? pattern_gradient_size(band_length, band_width, rows, spacing)
    : [];

function surface_positions(cfg, band_length, band_width) =
    pattern_positions(
        surface_cfg_pattern(cfg),
        band_length,
        band_width,
        surface_cfg_rows(cfg),
        surface_cfg_spacing(cfg)
    );

function surface_position_is_clear(p, band_length, latch_clearance) =
    p[0] > latch_clearance && p[0] < band_length - latch_clearance;

function surface_socket_diameter(cfg) =
    is_undef(surface_cfg_socket_diameter(cfg)) ?
        surface_cfg_stud_size(cfg) * 0.5 :
        surface_cfg_socket_diameter(cfg);

// --- positive top design ---------------------------------------------------

module bracelet_surface_from_config(surface_cfg, band_cfg, latch_cfg) {
    mode = surface_cfg_mode(surface_cfg);
    length = band_cfg_length(band_cfg);
    width = band_cfg_width(band_cfg);
    thickness = band_cfg_thickness(band_cfg);
    latch_clearance = latch_cfg_clearance(latch_cfg);
    positions = surface_positions(surface_cfg, length, width);

    if (mode == "integral")
        for (p = positions)
            if (surface_position_is_clear(p, length, latch_clearance))
                translate([p[0], p[1], thickness])
                    place_stud(
                        surface_cfg_stud_module(surface_cfg),
                        surface_cfg_stud_size(surface_cfg),
                        surface_cfg_tip_radius(surface_cfg)
                    );
}

// --- negative attachment features -----------------------------------------

module bracelet_surface_cutouts_from_config(surface_cfg, band_cfg, latch_cfg) {
    mode = surface_cfg_mode(surface_cfg);
    length = band_cfg_length(band_cfg);
    width = band_cfg_width(band_cfg);
    thickness = band_cfg_thickness(band_cfg);
    latch_clearance = latch_cfg_clearance(latch_cfg);
    positions = surface_positions(surface_cfg, length, width);

    if (mode == "modular") {
        socket_depth = min(thickness, surface_cfg_socket_depth(surface_cfg));
        socket_d = surface_socket_diameter(surface_cfg);

        for (p = positions)
            if (surface_position_is_clear(p, length, latch_clearance))
                translate([p[0], p[1], thickness - socket_depth])
                    cylinder(h = socket_depth + 0.1, d = socket_d);
    } else if (mode == "bare_with_holes") {
        for (p = positions)
            if (surface_position_is_clear(p, length, latch_clearance))
                translate([p[0], p[1], -0.1])
                    cylinder(
                        h = thickness + 0.2,
                        d = surface_cfg_hole_diameter(surface_cfg)
                    );
    }
}
