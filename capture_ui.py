import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\ondra\.gemini\antigravity\brain\88569b9c-3d23-400f-a318-757360440f85"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=False
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        print("Navigating to React app on http://localhost:3000...")
        await page.goto("http://localhost:3000")
        await asyncio.sleep(2)
        
        # 1. Login Screen
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_login.png"))
        print("Captured: react_login.png")

        # Perform Login
        await page.click("button[type='submit']")
        await asyncio.sleep(2)

        # 2. Dashboard Screen
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_dashboard.png"))
        print("Captured: react_dashboard.png")

        # Click Access Control
        await page.click("text=Access Control")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_access.png"))
        print("Captured: react_access.png")

        # Click Inventory Catalog
        await page.click("text=Inventory Catalog")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_inventory.png"))
        print("Captured: react_inventory.png")

        # Click Print Label
        await page.click("text=Print Label (18mm)")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_onboarding.png"))
        print("Captured: react_onboarding.png")

        # Click User Management
        await page.click("text=User Management")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "react_users.png"))
        print("Captured: react_users.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_all())
