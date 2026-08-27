import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITEAPI_URL}/api`,
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
}); 