import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();



const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
let accessToken = "";
async function refreshAccessToken() {
    const response = await axios.post("https://accounts.spotify.com/api/token",
        new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: REFRESH_TOKEN,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        }
    );

    accessToken = response.data.access_token;
    console.log("✅ Token renovado:", accessToken);
}

app.get("/token", async (req, res) => {
    await refreshAccessToken();
    res.json({ accessToken });
});



app.get("/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
        const response = await axios.post("https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: "http://localhost:8080/callback",  // Debe coincidir con Spotify
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        console.log("✅ Nuevo Access Token:", accessToken);
        console.log("🔄 Nuevo Refresh Token:", refreshToken);

        return res.json({
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Error intercambiando código:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to exchange authorization code" });
    }
});

setInterval(refreshAccessToken, 50 * 60 * 1000);


app.listen(8080, () => console.log("Server running on port 8080"));

