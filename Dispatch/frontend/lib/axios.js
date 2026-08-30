import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5555/api",
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
}); 