import asyncio
import logging
from pathlib import Path
from urllib.parse import unquote, urlparse

import aiohttp

logger = logging.getLogger(__name__)

CHUNK_SIZE = 64 * 1024
CONNECT_TIMEOUT = 30
READ_TIMEOUT = 300
USER_AGENT = "side_dl/0.1.0"


def filename_from_url(url: str) -> str:
    path = unquote(urlparse(url).path)
    name = Path(path).name
    return name or "download"


def human_size(bytes_: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if bytes_ < 1024:
            return f"{bytes_:.1f} {unit}"
        bytes_ /= 1024
    return f"{bytes_:.1f} TB"


async def async_downloader(
    url: str,
    *,
    dest_dir: str | Path = ".",
    chunk_size: int = CHUNK_SIZE,
    session: aiohttp.ClientSession | None = None,
) -> Path:
    url = url.strip()
    dest = Path(dest_dir).expanduser().resolve()
    dest.mkdir(parents=True, exist_ok=True)

    filename = filename_from_url(url)
    path = dest / filename
    temp_path = path.with_suffix(f"{path.suffix}.part")

    headers = {"User-Agent": USER_AGENT}
    timeout = aiohttp.ClientTimeout(
        total=READ_TIMEOUT,
        connect=CONNECT_TIMEOUT,
    )

    downloaded = 0

    async def _do_download(s: aiohttp.ClientSession) -> None:
        nonlocal downloaded

        async with s.get(url, headers=headers, timeout=timeout) as resp:
            resp.raise_for_status()
            total_size: int | None = int(resp.headers.get("Content-Length", 0)) or None

            with open(temp_path, "wb") as f:
                async for chunk in resp.content.iter_chunked(chunk_size):
                    f.write(chunk)
                    downloaded += len(chunk)

                    if total_size:
                        percent = downloaded / total_size * 100
                        logger.info(
                            "%s: %.1f%% (%s / %s)",
                            filename,
                            percent,
                            human_size(downloaded),
                            human_size(total_size),
                        )
                    else:
                        logger.info("%s: %s downloaded", filename, human_size(downloaded))

    close_session = session is None
    s = session or aiohttp.ClientSession()

    try:
        await _do_download(s)
    except aiohttp.ClientResponseError as e:
        if temp_path.exists():
            temp_path.unlink()
        raise RuntimeError(f"HTTP {e.status} for {url}: {e.message}") from e
    except (aiohttp.ClientError, asyncio.TimeoutError) as e:
        if temp_path.exists():
            temp_path.unlink()
        raise RuntimeError(f"Download failed for {url}: {e}") from e

    temp_path.rename(path)
    logger.info("%s: complete (%s)", filename, human_size(downloaded))
    return path


async def download_many(
    urls: list[str],
    *,
    dest_dir: str | Path = ".",
    max_concurrent: int = 5,
) -> list[Path]:
    sem = asyncio.Semaphore(max_concurrent)

    async def bounded(url: str, s: aiohttp.ClientSession) -> Path:
        async with sem:
            return await async_downloader(url, dest_dir=dest_dir, session=s)

    async with aiohttp.ClientSession() as session:
        tasks = [bounded(url, session) for url in urls]
        return await asyncio.gather(*tasks)


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    urls = [
        "https://proof.ovh.net/files/1Mb.dat",
        "https://proof.ovh.net/files/10Mb.dat",
    ]

    results = await download_many(urls, dest_dir="downloads")
    for path in results:
        logger.info("saved: %s", path)


if __name__ == "__main__":
    asyncio.run(main())
