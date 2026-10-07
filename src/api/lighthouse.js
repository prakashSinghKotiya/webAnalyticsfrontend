import { axiosWithCreds } from "./axiosInstance";


export const generateLighthouseReport = async (url, strategy = 'mobile') => {
  const { data } = await axiosWithCreds.post('/lighthouse/report', {
    url,
    strategy,
  });
  return data;
};


export const getLighthouseResults = async (params = {}) => {
  const { data } = await axiosWithCreds.get('/lighthouse/results', { params });
  return data;
};


export const getLighthouseById = async (id) => {
  const { data } = await axiosWithCreds.get(`/lighthouse/result/${id}`);
  return data;
};
