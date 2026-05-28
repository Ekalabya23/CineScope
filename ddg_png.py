import urllib.request
import urllib.parse
import re
import json
import os

chars = ["Daredevil", "Bane Batman", "Luke Skywalker", "Mandalorian", "Sasuke Uchiha", "Pain Naruto"]
out_dir = "/home/ekalabya-23/Desktop/CineScope (Copy)/cinescope-frontend/public/assets/characters"

for c in chars:
    try:
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(c + " transparent png")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        # very crude regex to find image urls
        links = re.findall(r'href="([^"]+\.png)"', html)
        if not links:
            # try finding any url ending in png
            links = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+\.png', html)
            
        found = False
        for link in links:
            if "duckduckgo" in link or "logo" in link: continue
            try:
                print(f"Trying to download {c} from {link}")
                req2 = urllib.request.Request(link, headers={'User-Agent': 'Mozilla/5.0'})
                data = urllib.request.urlopen(req2, timeout=5).read()
                filename = c.split()[0].lower() + ".png"
                with open(os.path.join(out_dir, filename), "wb") as f:
                    f.write(data)
                print(f"Successfully downloaded {filename}")
                found = True
                break
            except Exception as e:
                pass
        if not found:
            print(f"Could not find PNG for {c}")
    except Exception as e:
        print(f"Failed {c}: {e}")
