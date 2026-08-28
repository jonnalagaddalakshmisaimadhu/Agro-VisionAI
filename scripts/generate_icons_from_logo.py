import os
from PIL import Image, ImageDraw

def process_and_generate_icons():
    source_img_path = r"C:\Users\jlaks\.gemini\antigravity-ide\brain\b6967074-386a-4f3b-83af-4399b833ef05\farmiq_app_logo_1787904546457.jpg"
    res_dir = r"c:\Users\jlaks\Downloads\Agro-VisionAI-main\Agro-VisionAI-main\Frontend\android\app\src\main\res"
    public_dir = r"c:\Users\jlaks\Downloads\Agro-VisionAI-main\Agro-VisionAI-main\Frontend\public"
    
    # Load source master image
    src = Image.open(source_img_path).convert("RGBA")
    w, h = src.size

    # Crop/Center to perfect square
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    cropped = src.crop((left, top, left + min_dim, top + min_dim))

    # Helper function to create rounded corner icon
    def create_rounded_icon(size, is_round=False):
        scaled = cropped.resize((size, size), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        
        if is_round:
            mask_draw.ellipse((0, 0, size, size), fill=255)
        else:
            # Rounded rectangle with smooth 22% squircle radius
            radius = int(size * 0.22)
            mask_draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
            
        output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        output.paste(scaled, (0, 0), mask)
        return output

    # Helper function to create adaptive icon foreground (padded to 66% safe zone)
    def create_adaptive_foreground(fg_size):
        fg_img = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        # Inner safe zone size (approx 66% of fg_size)
        safe_size = int(fg_size * 0.68)
        scaled_inner = cropped.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
        offset = (fg_size - safe_size) // 2
        fg_img.paste(scaled_inner, (offset, offset), scaled_inner)
        return fg_img

    # Android densities
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }

    print("Generating Android App Icons from pleasant logo...")
    for folder, (size, fg_size) in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. Standard Launcher Icon
        icon_sq = create_rounded_icon(size=size, is_round=False)
        icon_sq.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

        # 2. Round Launcher Icon
        icon_rd = create_rounded_icon(size=size, is_round=True)
        icon_rd.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

        # 3. Adaptive Foreground Icon
        icon_fg = create_adaptive_foreground(fg_size=fg_size)
        icon_fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        print(f"[OK] Generated {folder}: {size}x{size} & fg {fg_size}x{fg_size}")

    # Generate Web Assets
    print("Generating Web Favicons & Logos...")
    os.makedirs(public_dir, exist_ok=True)
    master_icon = cropped.resize((512, 512), Image.Resampling.LANCZOS)
    master_icon.save(os.path.join(public_dir, "farmiq-logo.png"), "PNG")
    master_icon.save(os.path.join(public_dir, "pwa-512x512.png"), "PNG")
    
    icon_192 = cropped.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(public_dir, "pwa-192x192.png"), "PNG")
    icon_192.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

    icon_64 = create_rounded_icon(size=64, is_round=True)
    icon_64.save(os.path.join(public_dir, "favicon.ico"), "ICO", sizes=[(64, 64), (32, 32), (16, 16)])
    print("[OK] All icons generated successfully from master logo!")

if __name__ == "__main__":
    process_and_generate_icons()
