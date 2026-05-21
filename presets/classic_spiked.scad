// presets/classic_spiked.scad — leather-bracelet authentic.
// MIT licensed.
//
// Long spikes, staggered double-row, leather-style buckle, medium adult.
// The default that ships in the README's Quick Start example.
//
// Auto-rendered to docs/configurator/stls/classic_spiked.stl by the
// build-presets workflow on every change to the SCAD tree.

include <../bracelet.scad>

studded_bracelet(
    circumference = 180,
    width         = 22,
    thickness     = 3,
    stud_module   = "long_spike",
    stud_pattern  = "staggered",
    stud_rows     = 2,
    latch         = "buckle",
    mode          = "integral"
);
