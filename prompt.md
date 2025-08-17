# To run this code you need to install the following dependencies:
# pip install google-genai

from google import genai
import os

def generate():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    result = client.models.generate_images(
        model="models/imagen-3.0-generate-002",
        prompt="""create a photo for this mutant animal character in action. here is some inspiring information:

Captain Bulldog (🇬🇧 🐶) - Brian Brad-dog
Inspired by: Captain Britain
Powers: Mystical strength derived from the Amulet of Right-On, flight (more of a determined, droopy-jowled glide), Force Field generation (powered by sheer stubbornness), can summon a cup of tea in any situation.
Origin: A mild-mannered bulldog from Essex who stumbled upon the mystical burial site of Merlin the Magician while chasing a squirrel. Chosen for his indomitable spirit (and refusal to let go of a squeaky toy), he now protects the United Kingdom from mystical threats and improperly brewed tea.
Difficulty: Medium


the image is in the style of comic book illustrator Marco Checchetto
""",
        config=dict(
            number_of_images=1,
            output_mime_type="image/jpeg",
            person_generation="ALLOW_ALL",
            aspect_ratio="1:1",
        ),
    )

    if not result.generated_images:
        print("No images generated.")
        return

    if len(result.generated_images) != 1:
        print("Number of images generated does not match the requested number.")

    for n, generated_image in enumerate(result.generated_images):
        generated_image.image.save(f"generated_image_{n}.jpg")


if __name__ == "__main__":
    generate()
