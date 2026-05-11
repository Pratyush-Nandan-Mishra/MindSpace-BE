import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const searchGoogle = async(query)=>{
    try {
        const res = await axios.get("https://serpapi.com/search", {
            params: {
                q: query,
                api_key: process.env.SERP_API_PRIVATE_KEY,
                engine: "google"
            }
        })

        return res.data.organic_results || [];
    } catch (error) {
        console.error ("SerpAPI error: ", error.response?.data || error.message)
        throw error
    }
}

export {searchGoogle}