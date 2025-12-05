#!/usr/bin/env python
"""Script to take a screenshot of a webpage with specific viewport."""

import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def take_screenshot(
    url: str,
    viewport_width: int,
    viewport_height: int,
    wait_time: float,
    output_path: str
) -> None:
    """Take a screenshot of the webpage."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": viewport_width, "height": viewport_height}
        )

        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")

        print(f"Waiting {wait_time} seconds...")
        await asyncio.sleep(wait_time)

        print(f"Taking screenshot and saving to {output_path}...")
        await page.screenshot(path=str(output_path), full_page=False)

        await browser.close()

        print(f"Screenshot saved successfully to {output_path}")


async def main():
    """Main entry point."""
    url = "http://localhost:8081/product/t-shirts2"
    viewport_width = 1920
    viewport_height = 1080
    wait_time = 3
    output_path = "C:/Users/Дарья/qq/ando/tests/screenshots/sidebar-fix-v6.png"

    await take_screenshot(url, viewport_width, viewport_height, wait_time, output_path)


if __name__ == "__main__":
    asyncio.run(main())
