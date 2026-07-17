import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5555/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
}); 