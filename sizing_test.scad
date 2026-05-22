// sizing_test.scad — print this before committing to a full bracelet.
//
// A short calibration strip with three example studs unioned on top.
// Wrap it around your wrist (it's flexible TPU). If the band wraps comfortably
// and the studs feel right, the full bracelet at your measured circumference
// will fit.
//
// Tweak `strip_length`, `width`, and `thickness` until the band feels right.

use <studs/pyramid.scad>
use <studs/dome.scad>
use <studs/cone_spike.scad>
use <core/band.scad>

$fn = 48;

strip_length = 50;   // mm — short enough to be a quick print
width        = 22;   // mm
thickness    = 3;    // mm

module sizing_test() {
    union() {
        bracelet_band(strip_length, width, thickness);

        // three reference studs spaced evenly
        translate([strip_length * 0.25, width / 2, thickness])
            stud_pyramid(size = 6, tip_radius = 0.4);
        translate([strip_length * 0.50, width / 2, thickness])
            stud_dome(size = 6, tip_radius = 0.4);
        translate([strip_length * 0.75, width / 2, thickness])
            stud_cone_spike(size = 6, tip_radius = 0.4);
    }
}

sizing_test();
