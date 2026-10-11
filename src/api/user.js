import { axiosWithCreds } from "./axiosInstance";
import { getGuestId } from "../utils/tokenStorage";

// Register user (requires OTP verification first)
export const registerUser = async ({ name, email, password, otp, guestId }) => {
  const activeGuestId = guestId || getGuestId();
  const { data } = await axiosWithCreds.post("/user/register", {
    name,
    email,
    password,
    otp,
    ...(activeGuestId ? { guestId: activeGuestId } : {}),
  });
  return data;
};

// Login user with dual-auth and guest socket room migration support
export const loginUser = async ({ email, password, guestId }) => {
  const activeGuestId = guestId || getGuestId();
  const { data } = await axiosWithCreds.post("/user/login", {
    email,
    password,
    ...(activeGuestId ? { guestId: activeGuestId } : {}),
  });
  return data;
};

// Logout user
export const logoutUser = async () => {
  const { data } = await axiosWithCreds.post("/user/logout");
  return data;
};

// Get user details (home session verification)
export const getUserDetails = async (config = {}) => {
  const { data } = await axiosWithCreds.get("/user/home", {
    _skipAuthExpired: true,
    ...config,
  });
  return data;
};
