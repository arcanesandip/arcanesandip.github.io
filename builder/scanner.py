import requests
import re
import json
import os
from PIL import Image
from io import BytesIO

# 1. SETTINGS
USERNAME = "arcanesandip"
PINNED_REPOS = ["collaboration", "dots", "learning-python"]

# Where to save the processed images (Fixed typo and added '../' to escape builder directory)
IMG_DIR = "../public/assets/project-thumbs"
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
                    return img_url
        except Exception:
            continue
    return None

def process_and_save_image(url, repo_name):
    """Downloads, resizes to 16:9, and converts image to WebP."""
    try:
        print(f"   -> Downloading image for {repo_name}...")
        response = requests.get(url, timeout=15)
        img = Image.open(BytesIO(response.content))
        img = img.convert("RGB")

        target_w, target_h = 800, 450
        img_w, img_h = img.size
        img_aspect = img_w / img_h
        target_aspect = target_w / target_h

        if img_aspect > target_aspect:
            new_h = target_h
            new_w = int(target_h * img_aspect)
        else:
            new_w = target_w
            new_h = int(target_w / img_aspect)

        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) / 2
        top = (new_h - target_h) / 2
        right = (new_w + target_w) / 2
        bottom = (new_h + target_h) / 2
        img = img.crop((left, top, right, bottom))

        filename = f"{repo_name}.webp"
        save_path = os.path.join(IMG_DIR, filename)
        img.save(save_path, "WEBP", quality=80)
        
        # Returns the relative path standard for your index.html to read cleanly
        return f"./public/assets/project-thumbs/{filename}"
    except Exception as e:
        print(f"   X Error processing image: {e}")
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
        
        # Corrected destination path to escape builder/ and go to public/assets/
        save_path = "../public/assets/profile.webp"
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
        response = requests.get(api_url)
        repos = response.json()
        if not isinstance(repos, list):
            print("Error: Could not fetch repos.")
            return
    except Exception as e:
        print(f"Connection Error: {e}")
        return
    
    portfolio_data = []

    for repo in repos:
        name = repo['name']
        if name in PINNED_REPOS:
            print(f"Adding: {name}")
            raw_img_url = get_image_from_readme(name)
            local_img_path = None
            if raw_img_url:
                local_img_path = process_and_save_image(raw_img_url, name)
            
            portfolio_data.append({
                "name": name,
                "description": repo.get('description', ""),
                "url": repo['html_url'],
                "stars": repo['stargazers_count'],
                "language": repo['language'],
                "tags": repo.get('topics', []),
                "image": local_img_path
            })

    # 2. SAVE AS NEW STRUCTURE
    output = {
        "profile_img": pfp_path,
        "projects": portfolio_data
    }

    # Saves to the root repository file by stepping out of builder directory
    with open('../projects.json', 'w') as f:
        json.dump(output, f, indent=4)
    
    print(f"\nSuccess! Found {len(portfolio_data)} projects and updated PFP.")

if __name__ == "__main__":
    main()