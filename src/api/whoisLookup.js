import { axiosWithCreds } from "./axiosInstance";


export const whoisLookup = async (url) => {
  const { data } = await axiosWithCreds.post("/whois/lookup", { url });
  return data;
};


export const getWhoisResults = async (params = {}) => {
  const { data } = await axiosWithCreds.get("/whois/results", { params });
  return data;
};
