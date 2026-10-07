import { axiosWithCreds } from "./axiosInstance";


export const TTFB_REGIONS = Object.freeze([
  { value: "india", label: "India" },
  { value: "europe", label: "Europe" },
  { value: "usa", label: "USA" },
]);

/** Sentinel region that fans a job out to every probe queue. */
export const ALL_REGIONS = "All";

export const findTTFB = async (url, region) => {
  const { data } = await axiosWithCreds.post("/ttfb/find", {
    url,
    region,
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
