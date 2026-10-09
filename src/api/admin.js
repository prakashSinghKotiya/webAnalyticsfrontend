import { axiosWithCreds } from "./axiosInstance";

// Admin: Get all users (paginated with optional search)
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
  const params = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const { data } = await axiosWithCreds.get("/admin/getusers", {
    params,
  });
  return data;
};

// Admin: Force logout a user
export const forceLogoutUser = async (userId) => {
  const { data } = await axiosWithCreds.post(`/admin/${userId}/logout`);
  return data;
};

// Admin: Soft delete a user
export const deleteUser = async (userId) => {
  const { data } = await axiosWithCreds.post(`/admin/${userId}`);
  return data;
};
