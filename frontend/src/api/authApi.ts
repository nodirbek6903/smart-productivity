import {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IChangePasswordRequest,
  IForgotPasswordRequest,
  IResetPasswordRequest,
} from "../types/Auth";
import { IUser } from "../types/User";
import api from "./../app/apiClient";

export const authApi = {
  /**
   * LOGIN
   */
  login: async (email: string, password: string): Promise<ILoginResponse> => {
    const body: ILoginRequest = { email, password };
    const res = await api.post("/auth/login", body);
    return res.data;
  },

  /**
   * REGISTER (Admin only)
   */
  register: async (payload: IRegisterRequest): Promise<IRegisterResponse> => {
    const res = await api.post<IRegisterResponse>("/auth/register", payload);
    return res.data;
  },

  /**
   * GET CURRENT USER
   */
  getMe: async (): Promise<IUser> => {
    const res = await api.get<IUser>("/auth/me");
    return res.data;
  },

  /**
   * LOGOUT
   */
  logout: async (): Promise<{ message: string }> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  /**
   * UPDATE PROFILE
   */
  updateProfile: async (payload: Partial<IUser>): Promise<IUser> => {
    const res = await api.put<IUser>("/auth/profile", payload);
    return res.data;
  },

  /**
   * UPDATE AVATAR (multipart/form-data)
   */
  updateAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.put("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data; // { avatar: "url" }
  },

  /**
   * CHANGE PASSWORD
   */
  changePassword: async (
    payload: IChangePasswordRequest
  ): Promise<{ message: string }> => {
    const res = await api.put("/auth/change-password", payload);
    return res.data;
  },

  /**
   * FORGOT PASSWORD
   */
  forgotPassword: async (
    payload: IForgotPasswordRequest
  ): Promise<{ message: string }> => {
    const res = await api.post("/auth/forgot-password", payload);
    return res.data;
  },

  /**
   * RESET PASSWORD
   */
  resetPassword: async (
    payload: IResetPasswordRequest
  ): Promise<{ message: string }> => {
    const res = await api.post("/auth/reset-password", payload);
    return res.data;
  },
};
