#!/usr/bin/env python3
"""
Cut ONE big square map picture into the tile folders the app understands.

  python tools/make-tiles.py map.png --terrain everon --layer topo --max-zoom 5 --out tiles-repo

Result:  tiles-repo/tiles/everon/{z}/{x}/{y}.webp   (topo)
         tiles-repo/tiles/everon/sat/{z}/{x}/{y}.webp   (--layer sat)
         tiles-repo/tiles/everon/drawn/{z}/{x}/{y}.webp (--layer drawn)

Rules the app expects:
  * the picture covers the WHOLE map, square, north at the top (tile y = 0 is the north row)
  * level z has 2^z x 2^z tiles of 256 x 256 px
Only use pictures you have the right to publish (see docs/offline-maps-github.md).

Needs:  pip install pillow
"""
import argparse, json, os, sys, time

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is missing. Run:  pip install pillow")

Image.MAX_IMAGE_PIXELS = None
TILE = 256


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image", help="square map picture (png/jpg/tif)")
    ap.add_argument("--terrain", required=True, choices=["everon", "arland", "kolguyev"])
    ap.add_argument("--layer", default="topo", choices=["topo", "sat", "drawn"])
    ap.add_argument("--min-zoom", type=int, default=0)
    ap.add_argument("--max-zoom", type=int, default=5)
    ap.add_argument("--quality", type=int, default=80, help="webp quality 1-100 (default 80)")
    ap.add_argument("--out", default="tiles-repo", help="output folder (the GitHub repo folder)")
    a = ap.parse_args()

    img = Image.open(a.image).convert("RGB")
    if img.width != img.height:
        sys.exit(f"The picture must be square, but it is {img.width}x{img.height}.")
    need = TILE * (2 ** a.max_zoom)
    if img.width < need:
        print(f"Note: the picture is {img.width}px but zoom {a.max_zoom} needs {need}px; it will be enlarged (blurry).")

    sub = {"topo": "", "sat": "sat", "drawn": "drawn"}[a.layer]
    base = os.path.join(a.out, "tiles", a.terrain, sub) if sub else os.path.join(a.out, "tiles", a.terrain)
    total = 0
    bytes_total = 0
    t0 = time.time()
    for z in range(a.min_zoom, a.max_zoom + 1):
        n = 2 ** z
        side = TILE * n
        level = img.resize((side, side), Image.LANCZOS)
        for x in range(n):
            d = os.path.join(base, str(z), str(x))
            os.makedirs(d, exist_ok=True)
            for y in range(n):
                tile = level.crop((x * TILE, y * TILE, (x + 1) * TILE, (y + 1) * TILE))
                p = os.path.join(d, f"{y}.webp")
                tile.save(p, "WEBP", quality=a.quality, method=4)
                bytes_total += os.path.getsize(p)
                total += 1
        print(f"zoom {z}: {n * n} tiles")

    info = {
        "terrain": a.terrain, "layer": a.layer, "minZoom": a.min_zoom, "maxZoom": a.max_zoom,
        "tiles": total, "bytes": bytes_total, "avgBytesPerTile": round(bytes_total / max(1, total)),
    }
    with open(os.path.join(base, "pack.json"), "w") as f:
        json.dump(info, f, indent=2)
    print(f"Done: {total} tiles, {bytes_total/1024/1024:.1f} MB, {time.time()-t0:.0f}s -> {base}")
    print(f"Average {info['avgBytesPerTile']/1024:.1f} KB per tile (the app estimates 28 KB).")


if __name__ == "__main__":
    main()
