from pathlib import Path
import cairosvg

LETTERS_DIR = Path("public") / "signs" / "letters"
WORDS_DIR = Path("public") / "signs" / "words"

def convert(input_file, output_file, dir):
    cairosvg.svg2png(url=f"{dir}/input.svg", write_to=f"{dir}/output.png")

if __name__ == "__main__":
    for item in LETTERS_DIR.iterdir():
        cairosvg.svg2png(url=f"{dir}/{item.name}.svg", write_to=f"{dir}/{item.name}.png")
