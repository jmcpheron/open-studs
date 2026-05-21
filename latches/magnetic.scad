// latches/magnetic.scad — pocket for a neodymium magnet at each end.
// MIT licensed.
//
// STUB. Signature locked; geometry needs a magnet diameter parameter and
// careful glue-pocket design. Deferred.

module latch_magnetic(band_width, band_thickness, end = "both") {
    echo("WARN: latch_magnetic is a stub; producing placeholder geometry");
    color("red", 0.4)
        translate([-5, 0, band_thickness])
            cube([10, band_width, 1]);
}

latch_magnetic(22, 3);
