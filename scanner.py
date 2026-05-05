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
    """Checks main and master branches for the first image in README."""
    for branch in ['main', 'master']:
        url = f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/{branch}/README.md"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                found = re.findall(r'!\[.*?\]\((.*?)\)', res.text)
                if found:
                    img_url = found[0]
                    if not img_url.startswith("http"):
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
                "image": image
            })

    with open('projects.json', 'w') as f:
        json.dump(portfolio_data, f, indent=4)
    
    print(f"Success! Generated projects.json with {len(portfolio_data)} projects.")

if __name__ == "__main__":
    main()