"""Quantize the rendered world map PNG to a small palette to shrink it (run after build-map + Chrome render)."""
import sys
from PIL import Image

src = sys.argv[1]
im = Image.open(src).convert("RGBA")
# Keep alpha; quantize colour channels to a handful of tones.
q = im.quantize(colors=8, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
q.save(src, optimize=True)
print("optimized", src)
