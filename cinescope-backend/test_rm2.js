const dns = require("dns");
const https = require("https");
const axios = require("axios");
require("dotenv").config({ path: "/home/ekalabya-23/Desktop/CineScopeV2/cinescope-backend/.env" });

const tmdbResolver = new dns.Resolver();
tmdbResolver.setServers(["1.1.1.1", "8.8.8.8"]);

const agent = new https.Agent({
  lookup: (hostname, options, callback) => {
    tmdbResolver.resolve4(hostname, (error, addresses) => {
      if (error || !addresses[0]) return dns.lookup(hostname, { family: 4 }, callback);
      callback(null, addresses[0], 4);
    });
  }
});

async function run() {
  const res = await axios.get("https://api.themoviedb.org/3/search/tv", {
    httpsAgent: agent,
    params: { api_key: process.env.TMDB_API_KEY, query: "Running Man" },
  });
  const rm = res.data.results[0];
  console.log("Genres:", rm.genre_ids);
}
run();
