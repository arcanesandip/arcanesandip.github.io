"""
GitHub portfolio scanner

Why:
- Fetch pinned GitHub repos, extract a first README image, generate
    WebP thumbnails and produce an atomic `projects.json` payload consumed
    by the static site. The atomic write prevents partially-written JSON
    when the process is interrupted.

Failure boundaries and tradeoffs:
- The script treats network failures and malformed responses as fatal
    and calls `sys.exit(1)` to avoid leaving assets out-of-sync with the
    JSON payload.
"""

import requests
import re
import json
import os
import sys
import tempfile
from requests.exceptions import RequestException
from PIL import Image
from io import BytesIO

# 1. SETTINGS
USERNAME = "arcanesandip"
PINNED_REPOS = ["collaboration", "dots", "learning-python"]

# Base folder paths relative to this script
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
IMG_DIR = os.path.join(BASE_DIR, "..", "public", "assets", "project-thumbs")
PROFILE_PATH = os.path.join(BASE_DIR, "..", "public", "assets", "profile.webp")
os.makedirs(IMG_DIR, exist_ok=True)

def get_image_from_readme(repo_name):
    """Checks main and master branches for the first image in README."""
    for branch in ['main', 'master']:
        url = f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/{branch}/README.md"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                md_images = re.findall(r'!\[.*?\]\((.*?)\)', res.text)
                html_images = re.findall(r'<img [^>]*src="([^"]+)"', res.text)
                found = md_images + html_images
                
                if found:
                    img_url = found[0]
                    if not img_url.startswith("http"):
                        img_url = img_url.lstrip('./')
                        img_url = f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/{branch}/{img_url}"
                    # GitHub user-attachments URLs may require proper headers
                    elif "github.com/user-attachments" in img_url:
                        # Ensure we're using the correct URL format
                        if not img_url.endswith(("?raw=true", "&raw=true")):
                            img_url = img_url + "?raw=true"
                    return img_url
        except Exception as e:
            print(f"   ! Error fetching README for {repo_name} on {branch}: {e}")
            continue
    return None

def process_and_save_image(url, repo_name):
    """Downloads, resizes to 16:9, and converts image to WebP (Desktop & Mobile)."""
    try:
        print(f"   -> Downloading image for {repo_name}...")
        print(f"      URL: {url}")
        response = requests.get(url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))
        img = img.convert("RGB")
        print(f"      Downloaded: {img.format} {img.size}")

        # Define sizes: (suffix, width, height)
        sizes = [("_desktop", 800, 450), ("_mobile", 400, 225)]
        paths = {}

        for suffix, target_w, target_h in sizes:
            try:
                print(f"      Processing {suffix.replace('_', '')}...")
                img_w, img_h = img.size
                img_aspect = img_w / img_h
                target_aspect = target_w / target_h

                if img_aspect > target_aspect:
                    new_h = target_h
                    new_w = int(target_h * img_aspect)
                else:
                    new_w = target_w
                    new_h = int(target_w / img_aspect)

                thumb = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                left = (new_w - target_w) / 2
                top = (new_h - target_h) / 2
                right = (new_w + target_w) / 2
                bottom = (new_h + target_h) / 2
                thumb = thumb.crop((left, top, right, bottom))

                filename = f"{repo_name}{suffix}.webp"
                save_path = os.path.join(IMG_DIR, filename)
                thumb.save(save_path, "WEBP", quality=80)
                paths[suffix.replace("_", "")] = f"./public/assets/project-thumbs/{filename}"
                print(f"      ✓ Saved: {filename}")
            except Exception as e:
                print(f"      ! Error processing {suffix}: {e}")
                continue
        
        return paths if paths else None
    except Exception as e:
        print(f"   X Error downloading image: {e}")
        return None

def process_profile_pic():
    """Downloads GitHub profile pic, resizes to square, and saves as WebP."""
    url = f"https://github.com/{USERNAME}.png"
    try:
        print(f"Updating profile picture for {USERNAME}...")
        response = requests.get(url, timeout=15)
        img = Image.open(BytesIO(response.content))
        img = img.convert("RGB")
        
        # Resize to a standard 400x400 square
        img = img.resize((400, 400), Image.Resampling.LANCZOS)
        
        save_path = PROFILE_PATH
        img.save(save_path, "WEBP", quality=90)
        
        return "./public/assets/profile.webp"
    except Exception as e:
        print(f"   X Error updating profile pic: {e}")
        return f"https://github.com/{USERNAME}.png"

def main():
    print(f"Scanning GitHub for: {PINNED_REPOS}...")
    
    # 1. PROCESS PROFILE PIC FIRST
    pfp_path = process_profile_pic()
    
    api_url = f"https://api.github.com/users/{USERNAME}/repos"
    try:
        response = requests.get(api_url, timeout=10)
        if response.status_code == 403:
            print("GitHub API error: rate limit or access denied (403).")
            sys.exit(1)
        if not response.ok:
            print(f"GitHub API error: HTTP {response.status_code}.")
            sys.exit(1)

        repos = response.json()
        if not isinstance(repos, list):
            print("Error: Could not fetch repos.")
            sys.exit(1)
    except RequestException as e:
        print(f"Connection Error: {e}")
        sys.exit(1)
    
    portfolio_data = []

    for repo in repos:
        name = repo['name']
        if name in PINNED_REPOS:
            print(f"Adding: {name}")
            raw_img_url = get_image_from_readme(name)
            local_img_paths = None
            if raw_img_url:
                local_img_paths = process_and_save_image(raw_img_url, name)
            
            portfolio_data.append({
                "name": name,
                "description": repo.get('description', ""),
                "url": repo['html_url'],
                "stars": repo['stargazers_count'],
                "language": repo['language'],
                "tags": repo.get('topics', []),
                "images": local_img_paths
            })

    # 2. SAVE AS NEW STRUCTURE
    output = {
        "profile_img": pfp_path,
        "projects": portfolio_data
    }

    # Safely write the portfolio JSON atomically to prevent corruption
    target_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'projects.json'))
    temp_dir = os.path.dirname(target_path)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False, dir=temp_dir, suffix='.tmp') as tmp_file:
        json.dump(output, tmp_file, indent=4)
        tmp_file.flush()
        os.fsync(tmp_file.fileno())
    os.replace(tmp_file.name, target_path)
    
    print(f"\nSuccess! Found {len(portfolio_data)} projects and updated PFP.")

if __name__ == "__main__":
    main()