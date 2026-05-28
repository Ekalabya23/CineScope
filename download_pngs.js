const fs = require('fs');
const https = require('https');
const path = require('path');

const characters = {
  "iron-man": "https://pngimg.com/d/ironman_PNG44.png",
  "captain-america": "https://pngimg.com/d/captain_america_PNG62.png",
  "thor": "https://pngimg.com/d/thor_PNG34.png",
  "daredevil": "https://www.pngmart.com/files/13/Daredevil-PNG-Image.png",
  "batman": "https://pngimg.com/d/batman_PNG111.png",
  "joker": "https://pngimg.com/d/joker_PNG41.png",
  "bane": "https://www.pngmart.com/files/13/Bane-PNG-Clipart.png",
  "luke-skywalker": "https://www.pngmart.com/files/11/Luke-Skywalker-PNG-Transparent-Image.png",
  "darth-vader": "https://pngimg.com/d/darth_vader_PNG13.png",
  "mandalorian": "https://www.pngmart.com/files/13/The-Mandalorian-PNG-HD.png",
  "naruto": "https://pngimg.com/d/naruto_PNG15.png",
  "sasuke": "https://www.pngmart.com/files/13/Sasuke-Uchiha-PNG-File.png",
  "pain": "https://www.pngmart.com/files/22/Pain-Naruto-PNG.png"
};

const dir = "/home/ekalabya-23/Desktop/CineScope (Copy)/cinescope-frontend/public/assets/characters";

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(characters)) {
    try {
      console.log(`Downloading ${name}...`);
      await download(url, path.join(dir, `${name}.png`));
    } catch (e) {
      console.error(e.message);
    }
  }
}
run();
