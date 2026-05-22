// core/latch.scad — closure assembly dispatch.
// MIT licensed. See LICENSE-MIT.

include <config.scad>

use <../latches/buckle.scad>
use <../latches/snap.scad>
use <../latches/loop_post.scad>
use <../latches/friction_overlap.scad>
use <../latches/magnetic.scad>

// Each latch owns its left/right geometry. The assembly places the left side
// at x=0 and the right side at x=band_length when the latch needs two calls.

module place_latch(name, band_width, band_thickness, band_length) {
    if      (name == "buckle")            _place_two_ended(name, band_width, band_thickness, band_length);
    else if (name == "snap")              _place_two_ended(name, band_width, band_thickness, band_length);
    else if (name == "loop_post")         _place_two_ended(name, band_width, band_thickness, band_length);
    else if (name == "friction_overlap")  _place_two_ended(name, band_width, band_thickness, band_length);
    else if (name == "magnetic")          _place_two_ended(name, band_width, band_thickness, band_length);
    else if (name == "none") { /* no latch */ }
    else echo(str("WARN: unknown latch '", name, "'"));
}

module _place_two_ended(name, band_width, band_thickness, band_length) {
    if      (name == "buckle") {
        latch_buckle(band_width, band_thickness, end = "left");
        translate([band_length, 0, 0])
            latch_buckle(band_width, band_thickness, end = "right");
    }
    else if (name == "snap") {
        latch_snap(band_width, band_thickness, end = "left");
        translate([band_length, 0, 0])
            latch_snap(band_width, band_thickness, end = "right");
    }
    else if (name == "loop_post") {
        latch_loop_post(band_width, band_thickness, end = "left");
        translate([band_length, 0, 0])
            latch_loop_post(band_width, band_thickness, end = "right");
    }
    else if (name == "friction_overlap") {
        latch_friction_overlap(band_width, band_thickness);
    }
    else if (name == "magnetic") {
        latch_magnetic(band_width, band_thickness, end = "left");
        translate([band_length, 0, 0])
            latch_magnetic(band_width, band_thickness, end = "right");
    }
}

module bracelet_latch_from_config(latch_cfg, band_cfg) {
    place_latch(
        latch_cfg_type(latch_cfg),
        band_cfg_width(band_cfg),
        band_cfg_thickness(band_cfg),
        band_cfg_length(band_cfg)
    );
}
