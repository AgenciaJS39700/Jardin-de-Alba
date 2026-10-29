"""Quita el fondo de cada pieza del ramo, recorta al contenido y guarda WebP con transparencia (máx. 640 px)."""
import sys, pathlib
from PIL import Image
from rembg import remove, new_session

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
ses = new_session("isnet-general-use")
for f in sorted(src.glob("*.png")):
    im = Image.open(f).convert("RGB")
    cut = remove(im, session=ses, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=12, alpha_matting_erode_size=8)
    box = cut.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    if box: cut = cut.crop(box)
    cut.thumbnail((640, 640), Image.LANCZOS)
    cut.save(out / (f.stem + ".webp"), "WEBP", quality=82, method=6)
    print(f.stem, cut.size)
