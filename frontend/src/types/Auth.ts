import { IUser } from "./User";

/**
 * Login request body
 */
export interface ILoginRequest {
  email: string;
  password: string;
}

/**
 * Login response from backend
 */
export interface ILoginResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    fullName: string;
    email: string;
    role: string; // ADMIN | MANAGER | USER
    token: string;
  };
}

/**
 * Register request body
 */
export interface IRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  roleName: string; // ADMIN | MANAGER | USER
}

/**
 * Register response
 */
export interface IRegisterResponse {
  user: IUser;
  message: string;
}

/**
 * Change password request body
 */
export interface IChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Forgot password request body
 */
export interface IForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request body
 */
export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
}
