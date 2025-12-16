import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { authApi } from "./api/authApi";
import {
  logout,
  setCredentials,
  finishAuthLoading,
} from "./features/auth/authSlice";
import AppRouter from "./router/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch(finishAuthLoading());
        return;
      }

      try {
        const res = await authApi.getMe();

        // BACKEND: { success, data: user }
        const user = res?.data ?? res;

        dispatch(setCredentials({ user, token }));
      } catch (err) {
        dispatch(logout());
      } finally {
        dispatch(finishAuthLoading());
      }
    };

    initAuth();
  }, [dispatch]);
  return (
    <>
      <AppRouter />

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
            padding: "12px 16px",
            borderRadius: "12px",
          },

          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
            style: {
              background: "#064e3b",
              border: "1px solid #10b981",
            },
          },

          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
            style: {
              background: "#450a0a",
              border: "1px solid #ef4444",
            },
          },

          loading: {
            style: {
              background: "#1e3a8a",
              border: "1px solid #3b82f6",
            },
          },
        }}
      />
    </>
  );
}

export default App;
