import { axiosWithCreds } from "./axiosInstance";


export const TTFB_REGIONS = Object.freeze([
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "canada", label: "Canada" },
]);

/** Sentinel region that fans a job out to every probe queue. */
export const ALL_REGIONS = "All";

export const findTTFB = async (url, region) => {
  const normRegion = String(region || "india").trim().toLowerCase();
  const { data } = await axiosWithCreds.post("/ttfb/find", {
    url,
    region: normRegion,
  });
  return data;
};


export const findTTFBAllRegions = async (url) => {
  const { data } = await axiosWithCreds.post("/ttfb/findAll", {
    url,
    region: ALL_REGIONS,
  });
  return data;
};

export const getTtfbResults = async (params = {}) => {
  const { data } = await axiosWithCreds.get("/ttfb/results", { params });
  return data;
};

export const getTtfbById = async (id) => {
  const { data } = await axiosWithCreds.get(`/ttfb/result/${id}`);
  return data;
};

export const getTtfbStatus = async (id) => {
  const { data } = await axiosWithCreds.get(`/ttfb/status/${id}`);
  return data;
};

