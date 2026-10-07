import { axiosWithCreds } from "./axiosInstance";


export const lookupDnsRecords = async (url) => {
  const { data } = await axiosWithCreds.post("/dns/lookup", {
    url,
  });
  return data;
};


export const getDnsResults = async (params = {}) => {
  const { data } = await axiosWithCreds.get("/dns/results", { params });
  return data;
};


export const getDnsById = async (id) => {
  const { data } = await axiosWithCreds.get(`/dns/result/${id}`);
  return data;
};

// Backwards compatibility alias
export const dnsLookup = lookupDnsRecords;
