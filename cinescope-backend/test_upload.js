const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

cloudinary.config({
  cloud_name: "dxnbfyws4",
  api_key: "456244417763975",
  api_secret: "xIQNFQNX_sLImFG6NJ8IFqfwlFM",
  secure: true,
});

async function test() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "cinescope/reels";
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, media_metadata: false },
    "xIQNFQNX_sLImFG6NJ8IFqfwlFM"
  );

  console.log("Signature:", signature);

  const form = new FormData();
  form.append("file", fs.createReadStream("test.mp4"));
  form.append("api_key", "456244417763975");
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("media_metadata", "false");
  form.append("signature", signature);

  try {
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dxnbfyws4/video/upload",
      form,
      { headers: form.getHeaders() }
    );
    console.log("Upload success:", res.data.secure_url);
  } catch (err) {
    console.error("Upload failed:", err.response?.data || err.message);
  }
}

// Create a dummy video file
fs.writeFileSync("test.mp4", "dummy video data");
test();
