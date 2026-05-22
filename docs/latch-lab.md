# Latch Lab

This is the fast feedback loop for bracelet closures. Each latch starts as a
small coupon before it earns its way onto a full bracelet.

## Print Protocol

Print the coupon in TPU before changing a full bracelet:

```sh
uv run studslab build test_prints/latch_lab_three_pack.scad -o build/test_prints/latch_lab_three_pack.stl
```

Use the same TPU, layer height, and wall settings you expect for the bracelet.
Try each latch one-handed, then tug it open and closed at least 20 times.

## Scorecard

Use 1-5 for each:

| Latch | Holds pull | Closes one-handed | Opens intentionally | Comfortable underside | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| mushroom_keyhole | | | | | |
| ladder_strap | | | | | |
| loop_post_v2 | | | | | |

Useful notes are blunt and physical: "entry hole too tight", "post too tall",
"slot tears white", "digs into wrist", "easy but ugly", "secure but slow".

## Candidates

### `mushroom_keyhole`

Low-profile mushroom post on one end, keyhole tab on the other. The large hole
lets the head through; the narrow throat captures the shaft under tension.

What to watch:

- whether the mushroom head is too hard to push through
- whether the throat holds under wrist flex
- whether the post is too tall on the inside of the wrist

### `ladder_strap`

Adjustable ladder slots stretch over a low catch. This is the practical sizing
candidate: less elegant, more forgiving.

What to watch:

- which slot feels like the real engagement point
- whether the slots tear or whiten
- whether the catch block is too sharp or too low

### `loop_post_v2`

Lower, inboard loop-post with a guided keyhole instead of a plain loop. This is
the aesthetic candidate if it can be made comfortable.

What to watch:

- whether the loop tab bends enough to engage
- whether the relief dots help or create tear starts
- whether the lower post still captures reliably
