from pathlib import Path

from studslab.cli import _config_scad


def test_config_scad_maps_configurator_json_keys() -> None:
    scad = _config_scad(
        {
            "band": {
                "circumference": 190,
                "width": 30,
                "thickness": 4.2,
                "corner": 4,
                "flexRelief": "inside_slots",
                "reliefPitch": 8,
                "reliefWidth": 1.4,
            },
            "surface": {
                "mode": "integral",
                "stud": "star",
                "pattern": "double_row",
                "rows": 2,
                "studSize": 8,
                "tipRadius": 0.3,
                "studSpacing": None,
            },
            "latch": {
                "type": "mushroom_keyhole",
                "clearance": 24,
            },
            "export": {
                "stage": "print_flat",
                "testLength": 70,
            },
        },
        Path("/repo/bracelet.scad"),
    )

    assert "use </repo/bracelet.scad>" in scad
    assert "width = 30" in scad
    assert "thickness = 4.2" in scad
    assert 'flex_relief = "inside_slots"' in scad
    assert 'stud_module = "star"' in scad
    assert 'stud_pattern = "double_row"' in scad
    assert "stud_spacing = undef" in scad
    assert 'type = "mushroom_keyhole"' in scad
