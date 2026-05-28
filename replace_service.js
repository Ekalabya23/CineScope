const fs = require('fs');

const file_path = "cinescope-backend/src/services/exploreService.ts";
let content = fs.readFileSync(file_path, "utf8");

const maps = {
  "iron-man": "/assets/characters/iron-man.png",
  "captain-america": "/assets/characters/captain-america.png",
  "thor": "/assets/characters/thor.png",
  "daredevil": "/assets/characters/daredevil.png",
  "batman-begins": "/assets/characters/batman.png",
  "joker": "/assets/characters/joker.png",
  "bane": "/assets/characters/bane.png",
  "luke-skywalker": "/assets/characters/luke-skywalker.png",
  "darth-vader": "/assets/characters/darth-vader.png",
  "the-mandalorian": "/assets/characters/mandalorian.png",
  "naruto": "/assets/characters/naruto.png",
  "sasuke": "/assets/characters/sasuke.png",
  "pain": "/assets/characters/pain.png"
};

for (const [id, url] of Object.entries(maps)) {
  const regex = new RegExp(`id:\\s*"${id}",[\\s\\S]*?avatarUrl:\\s*"([^"]+)"`, "g");
  content = content.replace(regex, (match, p1) => {
    return match.replace(p1, url);
  });
}

fs.writeFileSync(file_path, content);
console.log("Updated exploreService.ts");
