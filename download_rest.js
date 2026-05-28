const fs = require('fs');
const https = require('https');
const path = require('path');

const chars = {
  "daredevil": "https://pngimg.com/d/daredevil_PNG5.png",
  "bane": "https://pngimg.com/d/bane_PNG13.png",
  "luke-skywalker": "https://pngimg.com/d/star_wars_PNG25.png",
  "mandalorian": "https://pngimg.com/d/mandalorian_PNG15.png",
  "sasuke": "https://pngimg.com/d/sasuke_PNG33.png",
  "pain": "https://pngimg.com/d/akatsuki_PNG13.png"
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
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(chars)) {
    try {
      console.log(`Downloading ${name}...`);
      await download(url, path.join(dir, `${name}.png`));
      console.log(`Success ${name}`);
    } catch (e) {
      console.log(`Failed ${name}`);
    }
  }
}
run();
