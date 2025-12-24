import asyncio
import time
from pathlib import Path
from embeddings_models.clip_embeddings import embed_image


async def main():
    image_path = Path("images/cosmetics_shop_1.jpg")
    image_buffer = image_path.read_bytes()

    while True:
        start_time = time.perf_counter()

        embedding = await embed_image(image_buffer)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        print(
            f"File: {image_path.name} | "
            f"Embedding size: {len(embedding)} | "
            f"Time: {elapsed_ms:.2f} ms"
        )

        await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
