const axios = require("axios");
require("dotenv").config({ path: "/home/ekalabya-23/Desktop/CineScopeV2/cinescope-backend/.env" });

async function run() {
  try {
    // 1. Search for Running Man
    const res = await axios.get("https://api.themoviedb.org/3/search/tv", {
      params: { api_key: process.env.TMDB_API_KEY, query: "Running Man" },
    });
    const rm = res.data.results[0];
    console.log("Running Man genres:", rm.genre_ids);
    
    // 2. Fetch Ahn Hyo-seop credits
    const personSearch = await axios.get("https://api.themoviedb.org/3/search/person", {
      params: { api_key: process.env.TMDB_API_KEY, query: "Ahn Hyo-seop" },
    });
    const person = personSearch.data.results[0];
    
    const creds = await axios.get(`https://api.themoviedb.org/3/person/${person.id}/combined_credits`, {
      params: { api_key: process.env.TMDB_API_KEY }
    });
    const rmCredit = creds.data.cast.find(c => c.id === rm.id);
    console.log("Ahn Hyo-seop RM credit character:", rmCredit ? rmCredit.character : "Not found in cast");
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
