import requests
import re
import json

# 1. SETTINGS
USERNAME = "arcanesandip"

# The only repos that will be included
PINNED_REPOS = [
    "collaboration", 
    "dots", 
    "learning-python",
] 

def get_image_from_readme(repo_name):
    """Checks main and master branches for the first image in README (Markdown or HTML)."""
    for branch in ['main', 'master']:
        url = f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/{branch}/README.md"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                # 1. Try finding Markdown images: ![alt](url)
                md_images = re.findall(r'!\[.*?\]\((.*?)\)', res.text)
                # 2. Try finding HTML images: <img src="url">
                html_images = re.findall(r'<img [^>]*src="([^"]+)"', res.text)
                
                found = md_images + html_images
                
                if found:
                    img_url = found[0]
                    if not img_url.startswith("http"):
                        # Handle relative paths
                        img_url = img_url.lstrip('./')
                        img_url = f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/{branch}/{img_url}"
                    return img_url
        except Exception:
            continue
    return None

def main():
    print(f"Scanning GitHub for strictly: {PINNED_REPOS}...")
    api_url = f"https://api.github.com/users/{USERNAME}/repos"
    
    try:
        response = requests.get(api_url)
        repos = response.json()
        
        if not isinstance(repos, list):
            print("Error: Could not fetch repos. Check username or API limits.")
            return
    except Exception as e:
        print(f"Connection Error: {e}")
        return
    
    portfolio_data = []

    for repo in repos:
        name = repo['name']
        
        # STRICT FILTER: Name must be in the list
        if name in PINNED_REPOS:
            print(f"Adding: {name}")
            image = get_image_from_readme(name)
            
            portfolio_data.append({
                "name": name,
                "description": repo['description'],
                "url": repo['html_url'],
                "stars": repo['stargazers_count'],
                "language": repo['language'],
                "tags": repo.get('topics', []), # Added the tags/topics from GitHub metadata
                "image": image
            })

    with open('projects.json', 'w') as f:
        json.dump(portfolio_data, f, indent=4)
    
    print(f"Success! Generated projects.json with {len(portfolio_data)} projects.")

if __name__ == "__main__":
    main()