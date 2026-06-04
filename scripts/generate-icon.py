"""Génère public/logo-tempo.ico pour le Bureau et la barre des tâches Windows."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCES = [
    PUBLIC / "logo-tempo.jfif",
    Path(r"C:\Users\User\Downloads\logotempo.jfif"),
]
OUT = PUBLIC / "logo-tempo.ico"

def main():
    src = next((p for p in SOURCES if p.exists()), None)
    if not src:
        raise SystemExit("Logo introuvable (logo-tempo.jfif)")
    img = Image.open(src).convert("RGBA")
    img = img.resize((256, 256), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(
        OUT,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print(f"Icône créée : {OUT}")

if __name__ == "__main__":
    main()