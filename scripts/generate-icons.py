"""
Renders the raster app icons from the same geometry as `app/icon.svg`.

Search engines and older clients need more than an SVG: Google looks for a
square icon whose side is a multiple of 48px, and a great many clients probe
`/favicon.ico` at the root regardless of what the page declares.

    python3 scripts/generate-icons.py

Writes app/favicon.ico, app/icon.png and app/apple-icon.png.
"""

import math
from PIL import Image, ImageDraw

RAUSCH = (255, 56, 92, 255)
WHITE = (255, 255, 255, 255)
MASTER = 1024


def star_points(cx, cy, outer, inner, points=5, rotation=-math.pi / 2):
    """Alternating outer/inner vertices, first point straight up."""
    result = []
    for i in range(points * 2):
        radius = outer if i % 2 == 0 else inner
        angle = rotation + i * math.pi / points
        result.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return result


def render(size, *, rounded=True):
    """One icon at `size`, drawn large and downsampled so edges stay clean."""
    image = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if rounded:
        draw.rounded_rectangle([0, 0, MASTER - 1, MASTER - 1], radius=int(MASTER * 0.22), fill=RAUSCH)
    else:
        # iOS applies its own mask, so the touch icon stays full-bleed.
        draw.rectangle([0, 0, MASTER - 1, MASTER - 1], fill=RAUSCH)

    centre = MASTER / 2
    # Optical centring: a five-point star's visual mass sits below its bounds.
    draw.polygon(
        star_points(centre, centre * 1.04, MASTER * 0.33, MASTER * 0.33 * 0.42),
        fill=WHITE,
    )
    return image.resize((size, size), Image.LANCZOS)


rounded_master = render(512)
rounded_master.resize((96, 96), Image.LANCZOS).save("app/icon.png")
render(180, rounded=False).save("app/apple-icon.png")
# Multi-resolution .ico so the root probe answers at every common size.
rounded_master.save("app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote app/favicon.ico, app/icon.png, app/apple-icon.png")
