export interface LoginResponse {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  token: string;
}

export interface AuthPayload {
  user: any;
  token: string;
}
