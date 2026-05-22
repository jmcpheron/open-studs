// core/config.scad — grouped design configuration helpers.
// MIT licensed. See LICENSE-MIT.
//
// The public `studded_bracelet(...)` API stays flat for hand editing, but the
// assembly uses these grouped configs internally. They mirror the GitHub Pages
// configurator sections: band, surface, latch, and export stage.

OPEN_STUDS_FN = 48;

OPEN_STUDS_DEFAULT_CIRCUMFERENCE = 180;
OPEN_STUDS_DEFAULT_WIDTH         = 22;
OPEN_STUDS_DEFAULT_THICKNESS     = 3;
OPEN_STUDS_DEFAULT_CORNER        = 4;
OPEN_STUDS_LATCH_MARGIN          = 25;

OPEN_STUDS_DEFAULT_STUD          = "pyramid";
OPEN_STUDS_DEFAULT_PATTERN       = "single_row";
OPEN_STUDS_DEFAULT_ROWS          = 1;
OPEN_STUDS_DEFAULT_STUD_SIZE     = 6;
OPEN_STUDS_DEFAULT_TIP_RADIUS    = 0.4;

OPEN_STUDS_DEFAULT_SOCKET_DEPTH  = 1.5;
OPEN_STUDS_DEFAULT_HOLE_DIAMETER = 3;

// --- band config -----------------------------------------------------------

function band_config(
    circumference      = OPEN_STUDS_DEFAULT_CIRCUMFERENCE,
    width              = OPEN_STUDS_DEFAULT_WIDTH,
    thickness          = OPEN_STUDS_DEFAULT_THICKNESS,
    corner             = OPEN_STUDS_DEFAULT_CORNER,
    flex_relief        = "none",
    relief_pitch       = 10,
    relief_width       = 1.2,
    relief_depth       = undef,
    relief_edge_margin = 2,
    relief_margin      = OPEN_STUDS_LATCH_MARGIN
) = [
    circumference,
    width,
    thickness,
    corner,
    flex_relief,
    relief_pitch,
    relief_width,
    relief_depth,
    relief_edge_margin,
    relief_margin
];

function band_cfg_length(c)             = c[0];
function band_cfg_width(c)              = c[1];
function band_cfg_thickness(c)          = c[2];
function band_cfg_corner(c)             = c[3];
function band_cfg_flex_relief(c)        = c[4];
function band_cfg_relief_pitch(c)       = c[5];
function band_cfg_relief_width(c)       = c[6];
function band_cfg_relief_depth(c)       = c[7];
function band_cfg_relief_edge_margin(c) = c[8];
function band_cfg_relief_margin(c)      = c[9];

// --- surface config --------------------------------------------------------

function surface_config(
    mode            = "integral",
    stud_module     = OPEN_STUDS_DEFAULT_STUD,
    stud_pattern    = OPEN_STUDS_DEFAULT_PATTERN,
    stud_rows       = OPEN_STUDS_DEFAULT_ROWS,
    stud_size       = OPEN_STUDS_DEFAULT_STUD_SIZE,
    tip_radius      = OPEN_STUDS_DEFAULT_TIP_RADIUS,
    stud_spacing    = undef,
    socket_depth    = OPEN_STUDS_DEFAULT_SOCKET_DEPTH,
    socket_diameter = undef,
    hole_diameter   = OPEN_STUDS_DEFAULT_HOLE_DIAMETER
) = [
    mode,
    stud_module,
    stud_pattern,
    stud_rows,
    stud_size,
    tip_radius,
    stud_spacing,
    socket_depth,
    socket_diameter,
    hole_diameter
];

function surface_cfg_mode(c)            = c[0];
function surface_cfg_stud_module(c)     = c[1];
function surface_cfg_pattern(c)         = c[2];
function surface_cfg_rows(c)            = c[3];
function surface_cfg_stud_size(c)       = c[4];
function surface_cfg_tip_radius(c)      = c[5];
function surface_cfg_spacing(c)         = c[6];
function surface_cfg_socket_depth(c)    = c[7];
function surface_cfg_socket_diameter(c) = c[8];
function surface_cfg_hole_diameter(c)   = c[9];

// --- latch config ----------------------------------------------------------

function latch_config(
    type      = "buckle",
    clearance = OPEN_STUDS_LATCH_MARGIN
) = [
    type,
    clearance
];

function latch_cfg_type(c)      = c[0];
function latch_cfg_clearance(c) = c[1];

// --- export config ---------------------------------------------------------

function export_config(
    stage       = "print_flat",
    test_length = 70
) = [
    stage,
    test_length
];

function export_cfg_stage(c)       = c[0];
function export_cfg_test_length(c) = c[1];
