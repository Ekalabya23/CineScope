const axios = require("axios");
require("dotenv").config({ path: "/home/ekalabya-23/Desktop/CineScopeV2/cinescope-backend/.env" });

async function run() {
  try {
    console.log("TMDB Key exists:", !!process.env.TMDB_API_KEY);
    const res = await axios.get("https://api.themoviedb.org/3/search/person", {
      params: { api_key: process.env.TMDB_API_KEY, query: "Leonardo DiCaprio" },
    });
    console.log("Results for Leo:", res.data.results.length);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
