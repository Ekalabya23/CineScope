const fs = require('fs');
const https = require('https');

const TMDB_KEY = "071b2badc0dc0f598b5736d7429837ac";
const queries = {
  "Tony Stark / Iron Man": { query: "Robert Downey Jr", type: "person" },
  "Steve Rogers / Captain America": { query: "Chris Evans", type: "person" },
  "Thor Odinson": { query: "Chris Hemsworth", type: "person" },
  "Matt Murdock / Daredevil": { query: "Charlie Cox", type: "person" },
  "Bruce Wayne / Batman": { query: "Christian Bale", type: "person" },
  "The Joker": { query: "Heath Ledger", type: "person" },
  "Bane": { query: "Tom Hardy", type: "person" },
  "Luke Skywalker": { query: "Mark Hamill", type: "person" },
  "Darth Vader / Anakin": { query: "Hayden Christensen", type: "person" },
  "Din Djarin / The Mandalorian": { query: "Pedro Pascal", type: "person" }
};

const animeImages = {
  "Naruto Uzumaki": "https://m.media-amazon.com/images/M/MV5BZmQ5NGFiNWEtMmMyMC00MDdiLTg4YjktOGY5Yzc2MDUxMTE1XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg",
  "Sasuke Uchiha": "https://m.media-amazon.com/images/M/MV5BZGFiMWFhNDAtMzUyZS00NmQ2LTg4ZGUtNjc4NzgwMzhjZTVmXkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg",
  "Pain / Nagato": "https://m.media-amazon.com/images/M/MV5BMjA5OTMyNjExMl5BMl5BanBnXkFtZTgwMDY2MjgwMTE@._V1_.jpg"
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function fix() {
  let file = fs.readFileSync('cinescope-backend/src/services/exploreService.ts', 'utf8');
  
  for (const [name, info] of Object.entries(queries)) {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(info.query)}`;
      const res = await fetchJSON(searchUrl);
      if (res.results && res.results.length > 0 && res.results[0].profile_path) {
        const url = `https://image.tmdb.org/t/p/w500${res.results[0].profile_path}`;
        const regex = new RegExp(`name:\\s*"${name}".*?[\\s\\S]*?avatarUrl:\\s*"([^"]+)"`);
        file = file.replace(regex, (match, p1) => {
          return match.replace(p1, url);
        });
        console.log(`Updated ${name} with ${url}`);
      }
    } catch(e) { console.error(e); }
  }

  for (const [name, url] of Object.entries(animeImages)) {
    const regex = new RegExp(`name:\\s*"${name}".*?[\\s\\S]*?avatarUrl:\\s*"([^"]+)"`);
    file = file.replace(regex, (match, p1) => {
      return match.replace(p1, url);
    });
    console.log(`Updated ${name} with anime image`);
  }

  fs.writeFileSync('cinescope-backend/src/services/exploreService.ts', file);
  console.log("Done");
}

fix();
