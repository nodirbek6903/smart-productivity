import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "../../types/User";
import { saveToken, removeToken } from "../../utils/storage";

interface AuthState {
  user: IUser | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: IUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      saveToken(action.payload.token);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      removeToken();
    },

    finishAuthLoading: (state) => {
      state.loading = false;
    },
  },
});

export const { setCredentials, logout, finishAuthLoading } = authSlice.actions;

export default authSlice.reducer;
