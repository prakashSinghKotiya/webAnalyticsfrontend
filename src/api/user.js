import { axiosWithCreds } from "./axiosInstance";

// Register user (requires OTP verification first)
export const registerUser = async ({ name, email, password, otp }) => {
  const { data } = await axiosWithCreds.post("/user/register", {
    name,
    email,
    password,
    otp,
  });
  return data;
};

// Login user
export const loginUser = async ({ email, password }) => {
  const { data } = await axiosWithCreds.post("/user/login", {
    email,
    password,
  });
  return data;
};

// Logout user
export const logoutUser = async () => {
  const { data } = await axiosWithCreds.post("/user/logout");
  return data;
};

// Get user details (home)
export const getUserDetails = async (config = {}) => {
  const { data } = await axiosWithCreds.get("/user/home", {
    _skipAuthExpired: true,
    ...config,
  });
  return data;
};
