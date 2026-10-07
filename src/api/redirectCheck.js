import { axiosWithCreds } from "./axiosInstance";


export const checkRedirects = async (url) => {
  const { data } = await axiosWithCreds.post("/redirect/check", { url });
  return data;
};


export const getRedirectResults = async (params = {}) => {
  const { data } = await axiosWithCreds.get("/redirect/results", { params });
  return data;
};
