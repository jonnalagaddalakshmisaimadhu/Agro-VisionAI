from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class VersionInfo(BaseModel):
    latest_version: str
    min_required_version: str
    force_update: bool
    title: str
    title_te: Optional[str] = None
    release_notes: List[str]
    release_notes_te: Optional[List[str]] = None
    apk_url: str
    apk_size_mb: float
    published_date: str

# Current Production Release Configuration
CURRENT_APP_VERSION = "1.0.0"
LATEST_RELEASE = VersionInfo(
    latest_version="1.0.1",
    min_required_version="1.0.0",
    force_update=False,
    title="FarmIQ Super App Update v1.0.1",
    title_te="FarmIQ కొత్త అప్‌డేట్ v1.0.1 అందుబాటులో ఉంది!",
    release_notes=[
        "🪟 Added Center Windows Apps Hub for mobile navigation",
        "🎙️ Multi-language voice speaker in Government Schemes & Chatbot",
        "📱 Fully responsive UI optimized for all mobile devices",
        "🌦️ Live Weather Radar & soil district analysis enhancements",
        "⚡ Faster performance and offline caching"
    ],
    release_notes_te=[
        "🪟 మొబైల్ కోసం సెంటర్ విండోస్ క్విక్ యాప్స్ హబ్",
        "🎙️ ప్రభుత్వ పథకాలు & చాట్‌బాట్‌లో బహుభాషా వాయిస్ స్పీకర్",
        "📱 అన్ని మొబైల్ స్క్రీన్‌లకు అనుకూలమైన రెస్పాన్సివ్ డిజైన్",
        "🌦️ వేగవంతమైన లైవ్ వెదర్ రాడార్ & విశ్లేషణ",
        "⚡ వేగవంతమైన పనితీరు మరియు ఆటో-అప్‌డేట్ సదుపాయం"
    ],
    apk_url="https://github.com/jonnalagaddalakshmisaimadhu/Agro-VisionAI/releases/latest/download/app-debug.apk",
    apk_size_mb=65.5,
    published_date="2026-08-28"
)

def is_newer_version(latest: str, current: str) -> bool:
    """Compare semver strings e.g. 1.0.1 vs 1.0.0"""
    try:
        latest_parts = [int(p) for p in latest.strip("v").split(".")]
        current_parts = [int(p) for p in current.strip("v").split(".")]
        return latest_parts > current_parts
    except Exception:
        return latest != current

@router.get("/check-update")
async def check_app_update(
    current_version: str = Query(default="1.0.0", description="Current installed app version"),
    platform: str = Query(default="android", description="Platform: android, ios, web")
):
    """
    Check if a new version of the FarmIQ app is available.
    Returns version details, release notes, and direct APK download URL.
    """
    has_update = is_newer_version(LATEST_RELEASE.latest_version, current_version)
    must_force = is_newer_version(LATEST_RELEASE.min_required_version, current_version)

    return {
        "update_available": has_update,
        "force_update": must_force or LATEST_RELEASE.force_update,
        "current_installed_version": current_version,
        "latest_version": LATEST_RELEASE.latest_version,
        "title": LATEST_RELEASE.title,
        "title_te": LATEST_RELEASE.title_te,
        "release_notes": LATEST_RELEASE.release_notes,
        "release_notes_te": LATEST_RELEASE.release_notes_te,
        "apk_url": LATEST_RELEASE.apk_url,
        "apk_size_mb": LATEST_RELEASE.apk_size_mb,
        "published_date": LATEST_RELEASE.published_date,
        "platform": platform
    }

@router.get("/latest")
async def get_latest_version():
    """Get the full metadata of the latest release"""
    return LATEST_RELEASE

@router.get("/download-apk")
async def download_app_apk():
    """Directly stream and download the latest compiled FarmIQ Android APK"""
    import os
    from fastapi.responses import FileResponse
    
    # Path to compiled APK in project
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    apk_path = os.path.join(base_dir, "Frontend", "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    
    if os.path.exists(apk_path):
        return FileResponse(
            path=apk_path,
            filename="FarmIQ-v1.0.1.apk",
            media_type="application/vnd.android.package-archive"
        )
    raise HTTPException(status_code=404, detail="APK file not found on server")

