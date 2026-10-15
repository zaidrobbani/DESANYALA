import axios from "axios";
import { BASE_API_URL } from "@/lib/env";

export const axiosPublic = axios.create({
  baseURL: BASE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});
