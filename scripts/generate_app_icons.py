import os
import math
from PIL import Image, ImageDraw, ImageFilter

def draw_3leaf_emblem(size=1024, is_foreground=False, is_round=False):
    # Create super-sampled image (2x) for razor sharp anti-aliasing
    scale = 2
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = dim // 2, dim // 2

    # If full icon (not foreground only), draw background card
    if not is_foreground:
        # Draw soft ambient shadow
        shadow_margin = int(dim * 0.05)
        # Background card radius
        corner_r = int(dim * 0.22) if not is_round else dim // 2 - shadow_margin
        
        # Base White Card
        bg_card = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        bg_draw = ImageDraw.Draw(bg_card)
        
        box = [shadow_margin, shadow_margin, dim - shadow_margin, dim - shadow_margin]
        if is_round:
            bg_draw.ellipse(box, fill=(255, 255, 255, 255))
        else:
            bg_draw.rounded_rectangle(box, radius=corner_r, fill=(255, 255, 255, 255))
        
        # Subtle gradient stroke on border
        stroke_color = (220, 252, 231, 200) # light emerald green tint border
        if is_round:
            bg_draw.ellipse(box, outline=stroke_color, width=int(scale * 4))
        else:
            bg_draw.rounded_rectangle(box, radius=corner_r, outline=stroke_color, width=int(scale * 4))
            
        img.paste(bg_card, (0, 0), bg_card)

    # Calculate emblem dimensions and center positioning
    # For foreground adaptive icons, Android specifies standard icon in inner 66% safe zone
    emblem_scale = 0.55 if is_foreground else 0.65
    emblem_w = int(dim * emblem_scale)
    emblem_h = int(dim * emblem_scale)
    
    # Emblem origin
    emblem_ox = cx
    emblem_oy = cy - int(dim * 0.02)

    # 1. Left Leaf Layer
    left_leaf = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    ll_draw = ImageDraw.Draw(left_leaf)
    
    # Polygon curve for Left Leaf
    pts_left = []
    # Left Leaf Bezier approximation
    # Stem anchor at bottom
    p_base = (emblem_ox - int(emblem_w * 0.02), emblem_oy + int(emblem_h * 0.32))
    p_tip = (emblem_ox - int(emblem_w * 0.42), emblem_oy - int(emblem_h * 0.12))
    p_outer = (emblem_ox - int(emblem_w * 0.50), emblem_oy + int(emblem_h * 0.16))
    p_inner = (emblem_ox - int(emblem_w * 0.08), emblem_oy + int(emblem_h * 0.05))

    # Construct smooth polygon
    for t in [i/60.0 for i in range(61)]:
        # Outer curve (base -> outer -> tip)
        x = (1-t)**2 * p_base[0] + 2*(1-t)*t * p_outer[0] + t**2 * p_tip[0]
        y = (1-t)**2 * p_base[1] + 2*(1-t)*t * p_outer[1] + t**2 * p_tip[1]
        pts_left.append((x, y))
    for t in [i/60.0 for i in range(61)]:
        # Inner curve (tip -> inner -> base)
        x = (1-t)**2 * p_tip[0] + 2*(1-t)*t * p_inner[0] + t**2 * p_base[0]
        y = (1-t)**2 * p_tip[1] + 2*(1-t)*t * p_inner[1] + t**2 * p_base[1]
        pts_left.append((x, y))
    
    ll_draw.polygon(pts_left, fill=(34, 197, 94, 255)) # Emerald 500
    
    # 2. Right Leaf Layer
    right_leaf = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    rl_draw = ImageDraw.Draw(right_leaf)
    
    pts_right = []
    p_r_base = (emblem_ox + int(emblem_w * 0.02), emblem_oy + int(emblem_h * 0.32))
    p_r_tip = (emblem_ox + int(emblem_w * 0.42), emblem_oy - int(emblem_h * 0.12))
    p_r_outer = (emblem_ox + int(emblem_w * 0.50), emblem_oy + int(emblem_h * 0.16))
    p_r_inner = (emblem_ox + int(emblem_w * 0.08), emblem_oy + int(emblem_h * 0.05))

    for t in [i/60.0 for i in range(61)]:
        x = (1-t)**2 * p_r_base[0] + 2*(1-t)*t * p_r_outer[0] + t**2 * p_r_tip[0]
        y = (1-t)**2 * p_r_base[1] + 2*(1-t)*t * p_r_outer[1] + t**2 * p_r_tip[1]
        pts_right.append((x, y))
    for t in [i/60.0 for i in range(61)]:
        x = (1-t)**2 * p_r_tip[0] + 2*(1-t)*t * p_r_inner[0] + t**2 * p_r_base[0]
        y = (1-t)**2 * p_r_tip[1] + 2*(1-t)*t * p_r_inner[1] + t**2 * p_r_base[1]
        pts_right.append((x, y))
    
    rl_draw.polygon(pts_right, fill=(22, 163, 74, 255)) # Green 600

    # 3. Center Tall Leaf Layer (Almond / Sprout Shape)
    center_leaf = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    cl_draw = ImageDraw.Draw(center_leaf)

    p_c_tip = (emblem_ox, emblem_oy - int(emblem_h * 0.48))
    p_c_base = (emblem_ox, emblem_oy + int(emblem_h * 0.35))
    p_c_left_belly = (emblem_ox - int(emblem_w * 0.22), emblem_oy - int(emblem_h * 0.08))
    p_c_right_belly = (emblem_ox + int(emblem_w * 0.22), emblem_oy - int(emblem_h * 0.08))

    pts_center = []
    # Left belly (tip -> belly -> base)
    for t in [i/60.0 for i in range(61)]:
        x = (1-t)**2 * p_c_tip[0] + 2*(1-t)*t * p_c_left_belly[0] + t**2 * p_c_base[0]
        y = (1-t)**2 * p_c_tip[1] + 2*(1-t)*t * p_c_left_belly[1] + t**2 * p_c_base[1]
        pts_center.append((x, y))
    # Right belly (base -> belly -> tip)
    for t in [i/60.0 for i in range(61)]:
        x = (1-t)**2 * p_c_base[0] + 2*(1-t)*t * p_c_right_belly[0] + t**2 * p_c_tip[0]
        y = (1-t)**2 * p_c_base[1] + 2*(1-t)*t * p_c_right_belly[1] + t**2 * p_c_tip[1]
        pts_center.append((x, y))

    cl_draw.polygon(pts_center, fill=(74, 222, 128, 255)) # Bright vibrant Green 400

    # Delicate Center Vein (Crisp White with slight transparency)
    vein_w = max(2, int(scale * 3.5))
    cl_draw.line([p_c_tip, (p_c_base[0], p_c_base[1] - int(emblem_h * 0.04))], fill=(255, 255, 255, 240), width=vein_w)
    
    # Stem base
    cl_draw.line([p_c_base, (p_c_base[0], p_c_base[1] + int(emblem_h * 0.12))], fill=(21, 128, 61, 255), width=int(scale * 4.5))

    # Composite layers: Left & Right Leaves behind, Center Leaf in front
    img.paste(left_leaf, (0, 0), left_leaf)
    img.paste(right_leaf, (0, 0), right_leaf)
    img.paste(center_leaf, (0, 0), center_leaf)

    # Downsample to target size with high quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def generate_all_icons():
    res_dir = r"c:\Users\jlaks\Downloads\Agro-VisionAI-main\Agro-VisionAI-main\Frontend\android\app\src\main\res"
    public_dir = r"c:\Users\jlaks\Downloads\Agro-VisionAI-main\Agro-VisionAI-main\Frontend\public"
    
    # Android densities
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }

    print("Generating Android App Icons...")
    for folder, (size, fg_size) in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. Standard Square / Squircle Launcher Icon
        icon_sq = draw_3leaf_emblem(size=size, is_foreground=False, is_round=False)
        icon_sq.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

        # 2. Round Launcher Icon
        icon_rd = draw_3leaf_emblem(size=size, is_foreground=False, is_round=True)
        icon_rd.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

        # 3. Adaptive Foreground Icon
        icon_fg = draw_3leaf_emblem(size=fg_size, is_foreground=True, is_round=False)
        icon_fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        print(f"[OK] Generated {folder}: {size}x{size} & fg {fg_size}x{fg_size}")

    # Generate Web Assets
    print("Generating Web Favicons & Logos...")
    os.makedirs(public_dir, exist_ok=True)
    master_icon = draw_3leaf_emblem(size=512, is_foreground=False, is_round=False)
    master_icon.save(os.path.join(public_dir, "farmiq-logo.png"), "PNG")
    master_icon.save(os.path.join(public_dir, "pwa-512x512.png"), "PNG")
    
    icon_192 = draw_3leaf_emblem(size=192, is_foreground=False, is_round=False)
    icon_192.save(os.path.join(public_dir, "pwa-192x192.png"), "PNG")
    icon_192.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

    icon_64 = draw_3leaf_emblem(size=64, is_foreground=False, is_round=True)
    icon_64.save(os.path.join(public_dir, "favicon.ico"), "ICO", sizes=[(64, 64), (32, 32), (16, 16)])
    print("[OK] All Android and Web Icons generated successfully!")

if __name__ == "__main__":
    generate_all_icons()
