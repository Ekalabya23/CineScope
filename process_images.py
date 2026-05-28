import re
import os
import urllib.request
from rembg import remove
from PIL import Image
import io

file_path = "cinescope-backend/src/services/exploreService.ts"
out_dir = "cinescope-frontend/public/assets/characters"
os.makedirs(out_dir, exist_ok=True)

with open(file_path, 'r') as f:
    content = f.read()

# Extract character blocks
# Very crude extraction of id and avatarUrl
matches = re.finditer(r'id:\s*"([^"]+)",[^\}]+avatarUrl:\s*"([^"]+)"', content)

for match in matches:
    char_id = match.group(1)
    avatar_url = match.group(2)
    
    if "tmdb.org" in avatar_url or "amazon.com" in avatar_url:
        print(f"Processing {char_id} from {avatar_url}...")
        try:
            # Download image
            req = urllib.request.Request(avatar_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req).read()
            
            # Process with rembg
            input_image = Image.open(io.BytesIO(img_data))
            output_image = remove(input_image)
            
            # Save as PNG
            png_path = os.path.join(out_dir, f"{char_id}.png")
            output_image.save(png_path, "PNG")
            
            # Replace in file
            new_url = f"/assets/characters/{char_id}.png"
            content = content.replace(avatar_url, new_url)
            print(f"Saved {char_id}.png and updated service file.")
        except Exception as e:
            print(f"Error processing {char_id}: {e}")

with open(file_path, 'w') as f:
    f.write(content)

print("Done processing images.")
