// open-studs — parametric studded bracelet, source-of-truth.
// MIT licensed. See LICENSE-MIT.
//
// Top-level entry points:
//   - studded_bracelet(...): flat, hand-editable compatibility API.
//   - bracelet_from_config(...): segmented band/surface/latch/export API.
//
// The bracelet is exported flat for printing. The GitHub Pages viewer can
// bend that same STL around a wrist for preview without changing the print
// orientation.
//
// Quick start:
//
//   use <bracelet.scad>
//   studded_bracelet(
//       circumference = 180, width = 22, thickness = 3,
//       stud_module = "long_spike", stud_pattern = "staggered",
//       stud_rows = 2, latch = "buckle", mode = "integral"
//   );

include <core/config.scad>

use <core/band.scad>
use <core/surface.scad>
use <core/latch.scad>

$fn = OPEN_STUDS_FN;

// Compatibility constant for older user files and pattern discussions.
LATCH_MARGIN = OPEN_STUDS_LATCH_MARGIN;

// --- assembly stages -------------------------------------------------------

module bracelet_from_config(
    band    = band_config(),
    surface = surface_config(),
    latch   = latch_config(),
    export  = export_config()
) {
    stage = export_cfg_stage(export);

    if (stage == "print_flat") {
        _bracelet_print_flat(band, surface, latch);
    } else if (stage == "band_only") {
        bracelet_band_from_config(band);
    } else if (stage == "surface_only") {
        _bracelet_surface_only(band, surface, latch);
    } else if (stage == "latch_only") {
        _bracelet_latch_test(band, latch, export);
    } else {
        echo(str(
            "WARN: unknown export stage '", stage,
            "'; valid: print_flat, band_only, surface_only, latch_only"
        ));
        _bracelet_print_flat(band, surface, latch);
    }
}

module _bracelet_print_flat(band, surface, latch) {
    difference() {
        union() {
            bracelet_band_from_config(band);
            bracelet_surface_from_config(surface, band, latch);
            bracelet_latch_from_config(latch, band);
        }

        bracelet_surface_cutouts_from_config(surface, band, latch);
    }
}

module _bracelet_surface_only(band, surface, latch) {
    difference() {
        union() {
            bracelet_band_from_config(band);
            bracelet_surface_from_config(surface, band, latch);
        }

        bracelet_surface_cutouts_from_config(surface, band, latch);
    }
}

module _bracelet_latch_test(band, latch, export) {
    test_band = band_config(
        circumference      = export_cfg_test_length(export),
        width              = band_cfg_width(band),
        thickness          = band_cfg_thickness(band),
        corner             = band_cfg_corner(band),
        flex_relief        = "none",
        relief_margin      = latch_cfg_clearance(latch)
    );

    union() {
        bracelet_band_from_config(test_band);
        bracelet_latch_from_config(latch, test_band);
    }
}

// --- public compatibility API ---------------------------------------------

module studded_bracelet(
    circumference      = OPEN_STUDS_DEFAULT_CIRCUMFERENCE,
    width              = OPEN_STUDS_DEFAULT_WIDTH,
    thickness          = OPEN_STUDS_DEFAULT_THICKNESS,
    stud_module        = OPEN_STUDS_DEFAULT_STUD,
    stud_pattern       = OPEN_STUDS_DEFAULT_PATTERN,
    stud_rows          = OPEN_STUDS_DEFAULT_ROWS,
    stud_size          = OPEN_STUDS_DEFAULT_STUD_SIZE,
    tip_radius         = OPEN_STUDS_DEFAULT_TIP_RADIUS,
    stud_spacing       = undef,
    latch              = "buckle",
    mode               = "integral",
    flex_relief        = "none",
    relief_pitch       = 10,
    relief_width       = 1.2,
    relief_depth       = undef,
    latch_clearance    = OPEN_STUDS_LATCH_MARGIN,
    stage              = "print_flat",
    test_length        = 70
) {
    band_cfg = band_config(
        circumference = circumference,
        width         = width,
        thickness     = thickness,
        flex_relief   = flex_relief,
        relief_pitch  = relief_pitch,
        relief_width  = relief_width,
        relief_depth  = relief_depth,
        relief_margin = latch_clearance
    );

    surface_cfg = surface_config(
        mode         = mode,
        stud_module  = stud_module,
        stud_pattern = stud_pattern,
        stud_rows    = stud_rows,
        stud_size    = stud_size,
        tip_radius   = tip_radius,
        stud_spacing = stud_spacing
    );

    latch_cfg = latch_config(
        type      = latch,
        clearance = latch_clearance
    );

    export_cfg = export_config(
        stage       = stage,
        test_length = test_length
    );

    bracelet_from_config(
        band    = band_cfg,
        surface = surface_cfg,
        latch   = latch_cfg,
        export  = export_cfg
    );
}

// --- default render --------------------------------------------------------

studded_bracelet(
    circumference = OPEN_STUDS_DEFAULT_CIRCUMFERENCE,
    width         = OPEN_STUDS_DEFAULT_WIDTH,
    thickness     = OPEN_STUDS_DEFAULT_THICKNESS,
    stud_module   = OPEN_STUDS_DEFAULT_STUD,
    stud_pattern  = OPEN_STUDS_DEFAULT_PATTERN,
    stud_rows     = OPEN_STUDS_DEFAULT_ROWS,
    latch         = "buckle",
    mode          = "integral"
);
