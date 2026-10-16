import { axiosWithCreds, axiosWithoutCreds } from "./axiosInstance";
import { getGuestId } from "../utils/tokenStorage";

// Send OTP to email
export const sendOtp = async (email) => {
  const { data } = await axiosWithoutCreds.post("/auth/send-otp", { email });
  return data;
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  const { data } = await axiosWithoutCreds.post("/auth/verify-otp", { 
    email, 
    otp 
  });
  return data;
};

// Google OAuth Login
export const loginWithGoogle = async (idToken, guestId) => {
  const activeGuestId = guestId || getGuestId();
  const { data } = await axiosWithCreds.post("/auth/google", {
    idToken,
    token: idToken,
    credential: idToken,
    ...(activeGuestId ? { guestId: activeGuestId } : {}),
  });
  return data;
};