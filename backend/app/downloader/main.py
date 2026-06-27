import asyncio
from pathlib import Path
from urllib.parse import unquote, urlparse

import aiohttp


def filename_from_url(url):
    path = unquote(urlparse(url).path)
    name = Path(path).name
    return name or "download"


async def async_downloader(url):
    downloaded = 0
    filename = filename_from_url(url)

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            resp.raise_for_status()
            total_size = int(resp.headers.get("Content-Length", 0))

            with open(filename, "wb") as f:
                chunk_size = 16 * 1024
                async for chunk in resp.content.iter_chunked(chunk_size):
                    f.write(chunk)
                    downloaded += len(chunk)

                    if total_size:
                        progress = downloaded / total_size * 100
                        print(f"{filename}: {progress:.2f}%")
                    else:
                        print(f"{filename}: {downloaded} bytes")


async def main():
    urls = [
        "https://proof.ovh.net/files/1Mb.dat",
        "https://proof.ovh.net/files/10Mb.dat",
    ]
    tasks = []

    for url in urls:
        tasks.append(async_downloader(url))

    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
