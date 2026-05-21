// latches/buckle.scad — pin-through-hole buckle, leather-bracelet authentic.
// MIT licensed.
//
// One end gets the frame + pin; the other end gets a tongue with a row of
// holes. Caller invokes once at each end with end="left" or end="right".
//
// LEARNING-MODE NOTE: hole count and spacing is a UX call. Defaults below
// give 5 holes at 5 mm spacing => 20 mm of size adjustability. Goth subculture
// tends to want fewer, wider holes; festival use wants more, tighter holes.
// To tune, change BUCKLE_HOLES and BUCKLE_HOLE_SPACING. If you change them,
// also update src/open_studs/params.py to match (drift test will fail
// otherwise once Push 2 lands).

BUCKLE_HOLES         = 5;     // count of adjustment holes
BUCKLE_HOLE_SPACING  = 5;     // mm center-to-center
BUCKLE_HOLE_DIAMETER = 3.5;   // mm — sized to the printed pin
BUCKLE_PIN_DIAMETER  = 3.2;   // mm — slightly under hole for friction
BUCKLE_FRAME_LENGTH  = 12;    // mm — length of the buckle frame
BUCKLE_TONGUE_LENGTH = 35;    // mm — length of the tongue past the band

module latch_buckle(band_width, band_thickness, end = "both") {
    if (end == "left" || end == "both")  buckle_frame(band_width, band_thickness);
    if (end == "right" || end == "both") buckle_tongue(band_width, band_thickness);
}

module buckle_frame(band_width, band_thickness) {
    // a rectangular frame sitting at x=0, extending into -X by BUCKLE_FRAME_LENGTH.
    // pin runs across in Y.
    frame_w = band_width + 4;
    frame_l = BUCKLE_FRAME_LENGTH;
    wall    = 2.5;
    bar_d   = BUCKLE_PIN_DIAMETER;

    translate([-frame_l, -2, 0]) {
        difference() {
            // outer block
            cube([frame_l, frame_w, band_thickness]);
            // inner cutout
            translate([wall, wall, -0.1])
                cube([frame_l - 2 * wall, frame_w - 2 * wall, band_thickness + 0.2]);
        }
        // pin bar across the middle
        translate([frame_l / 2, 0, band_thickness / 2])
            rotate([-90, 0, 0])
                cylinder(h = frame_w, d = bar_d, $fn = 24);
    }
}

module buckle_tongue(band_width, band_thickness) {
    // a tongue at x=0 (right end of band) extending +X by BUCKLE_TONGUE_LENGTH,
    // with BUCKLE_HOLES holes punched through.
    tongue_w = band_width * 0.7;
    tongue_l = BUCKLE_TONGUE_LENGTH;

    difference() {
        translate([0, (band_width - tongue_w) / 2, 0])
            linear_extrude(height = band_thickness)
                offset(r = 3) offset(delta = -3)
                    square([tongue_l, tongue_w]);

        // adjustment holes, centered on the tongue, spaced from the band end
        hole_start = 10;
        for (i = [0 : BUCKLE_HOLES - 1])
            translate([hole_start + i * BUCKLE_HOLE_SPACING, band_width / 2, -0.1])
                cylinder(h = band_thickness + 0.2, d = BUCKLE_HOLE_DIAMETER);
    }
}

// development render — show the frame end on a stub of band so you can see
// how it sits.
*latch_buckle(22, 3, end = "both");
translate([0, 0, 0]) cube([60, 22, 3]);  // visible band stub
latch_buckle(22, 3, end = "left");
translate([60, 0, 0]) latch_buckle(22, 3, end = "right");
