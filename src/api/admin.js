import { axiosWithCreds } from "./axiosInstance";

// Admin: Get all users (paginated)
export const getAllUsers = async (page = 1, limit = 10) => {
  const { data } = await axiosWithCreds.get("/admin/getusers", {
    params: { page, limit },
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
