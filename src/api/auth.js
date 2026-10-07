import { axiosWithoutCreds } from "./axiosInstance";

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
