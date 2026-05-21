// latches/snap.scad — printed peg + socket snap closure.
// MIT licensed.
//
// STUB. Signature is locked; geometry is not yet designed. Producing a
// placeholder so the bracelet still compiles when this latch is selected.

module latch_snap(band_width, band_thickness, end = "both") {
    echo("WARN: latch_snap is a stub; producing placeholder geometry");
    // tiny visible marker so you can see where the latch is meant to go
    color("red", 0.4)
        translate([-5, 0, band_thickness])
            cube([10, band_width, 1]);
}

latch_snap(22, 3);
