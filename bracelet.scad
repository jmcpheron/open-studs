// open-studs — parametric studded bracelet
// MIT licensed. See LICENSE-MIT.
//
// Top-level entry point: studded_bracelet(...).
// The band is printed flat (a flat strip); TPU flex makes it wrap a wrist.
//
// Quick start (matches README.md verbatim):
//
//   include <bracelet.scad>
//   studded_bracelet(
//       circumference = 180, width = 22, thickness = 3,
//       stud_module = "long_spike", stud_pattern = "staggered",
//       stud_rows = 2, latch = "buckle", mode = "integral"
//   );

use <studs/pyramid.scad>
use <studs/dome.scad>
use <studs/cone_spike.scad>
use <studs/long_spike.scad>
use <studs/diamond.scad>
use <studs/flat_pyramid.scad>
use <studs/screw_head.scad>

use <latches/buckle.scad>
use <latches/snap.scad>
use <latches/loop_post.scad>
use <latches/friction_overlap.scad>
use <latches/magnetic.scad>

use <patterns/single_row.scad>
use <patterns/double_row.scad>
use <patterns/staggered.scad>
use <patterns/cluster.scad>
use <patterns/gradient_size.scad>

$fn = 48;

LATCH_MARGIN = 25;  // mm reserved at each end for latch hardware

// --- band geometry ---------------------------------------------------------

module band_strip(length, width, thickness, corner = 4) {
    linear_extrude(height = thickness)
        offset(r = corner) offset(delta = -corner)
            square([length, width], center = false);
}

// --- dispatch helpers ------------------------------------------------------
// OpenSCAD has no dynamic dispatch; we route by string. Adding a new stud
// means one new file under studs/ AND one new branch here.

module place_stud(name, size, tip_radius) {
    if      (name == "pyramid")       stud_pyramid(size, tip_radius);
    else if (name == "dome")          stud_dome(size, tip_radius);
    else if (name == "cone_spike")    stud_cone_spike(size, tip_radius);
    else if (name == "long_spike")    stud_long_spike(size, tip_radius);
    else if (name == "diamond")       stud_diamond(size, tip_radius);
    else if (name == "flat_pyramid")  stud_flat_pyramid(size, tip_radius);
    else if (name == "screw_head")    stud_screw_head(size, tip_radius);
    else echo(str("WARN: unknown stud_module '", name, "'"));
}

module place_latch(name, band_width, band_thickness, band_length) {
    if      (name == "buckle") {
        latch_buckle(band_width, band_thickness, end = "left");
        translate([band_length, 0, 0])
            mirror([1, 0, 0]) latch_buckle(band_width, band_thickness, end = "right");
    }
    else if (name == "snap")              latch_snap(band_width, band_thickness);
    else if (name == "loop_post")         latch_loop_post(band_width, band_thickness);
    else if (name == "friction_overlap")  latch_friction_overlap(band_width, band_thickness);
    else if (name == "magnetic")          latch_magnetic(band_width, band_thickness);
    else if (name == "none") { /* no latch */ }
    else echo(str("WARN: unknown latch '", name, "'"));
}

function pattern_positions(name, band_length, band_width, rows, spacing) =
      name == "single_row"    ? pattern_single_row(band_length, band_width, rows, spacing)
    : name == "double_row"    ? pattern_double_row(band_length, band_width, rows, spacing)
    : name == "staggered"     ? pattern_staggered(band_length, band_width, rows, spacing)
    : name == "cluster"       ? pattern_cluster(band_length, band_width, rows, spacing)
    : name == "gradient_size" ? pattern_gradient_size(band_length, band_width, rows, spacing)
    : [];

// --- main module -----------------------------------------------------------

module studded_bracelet(
    circumference = 180,
    width         = 22,
    thickness     = 3,
    stud_module   = "pyramid",
    stud_pattern  = "single_row",
    stud_rows     = 1,
    stud_size     = 6,
    tip_radius    = 0.4,
    stud_spacing  = undef,
    latch         = "buckle",
    mode          = "integral"
) {
    band_length = circumference;
    positions = pattern_positions(stud_pattern, band_length, width, stud_rows, stud_spacing);

    if (mode == "integral") {
        union() {
            band_strip(band_length, width, thickness);
            for (p = positions)
                if (p[0] > LATCH_MARGIN && p[0] < band_length - LATCH_MARGIN)
                    translate([p[0], p[1], thickness])
                        place_stud(stud_module, stud_size, tip_radius);
            place_latch(latch, width, thickness, band_length);
        }
    } else if (mode == "modular") {
        difference() {
            union() {
                band_strip(band_length, width, thickness);
                place_latch(latch, width, thickness, band_length);
            }
            // friction-fit sockets for modular studs (printed separately)
            for (p = positions)
                if (p[0] > LATCH_MARGIN && p[0] < band_length - LATCH_MARGIN)
                    translate([p[0], p[1], thickness - 1.5])
                        cylinder(h = 1.6, d = stud_size * 0.5);
        }
    } else if (mode == "bare_with_holes") {
        difference() {
            union() {
                band_strip(band_length, width, thickness);
                place_latch(latch, width, thickness, band_length);
            }
            for (p = positions)
                if (p[0] > LATCH_MARGIN && p[0] < band_length - LATCH_MARGIN)
                    translate([p[0], p[1], -0.1])
                        cylinder(h = thickness + 0.2, d = 3);
        }
    } else {
        echo(str("WARN: unknown mode '", mode, "'; valid: integral, modular, bare_with_holes"));
        band_strip(band_length, width, thickness);
    }
}

// --- default render --------------------------------------------------------

studded_bracelet(
    circumference = 180,
    width         = 22,
    thickness     = 3,
    stud_module   = "pyramid",
    stud_pattern  = "single_row",
    stud_rows     = 1,
    latch         = "buckle",
    mode          = "integral"
);
