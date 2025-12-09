import { Toaster } from "react-hot-toast";
import AppRouter from "./router/AppRouter";

function App() {
  return (
    <>
      <AppRouter />

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // 🔥 Default styling for ALL toasts
          style: {
            background: "#1f2937", // gray-800
            color: "#fff",
            border: "1px solid #374151", // gray-700
            padding: "12px 16px",
            borderRadius: "12px",
          },

          // 🔥 SUCCESS toast style
          success: {
            iconTheme: {
              primary: "#10b981", // emerald-500
              secondary: "#fff",
            },
            style: {
              background: "#064e3b", // emerald-900
              border: "1px solid #10b981",
            },
          },

          // 🔥 ERROR toast style
          error: {
            iconTheme: {
              primary: "#ef4444", // red-500
              secondary: "#fff",
            },
            style: {
              background: "#450a0a", // red-900
              border: "1px solid #ef4444",
            },
          },

          // 🔥 LOADING toast style
          loading: {
            style: {
              background: "#1e3a8a", // blue-900
              border: "1px solid #3b82f6",
            },
          },
        }}
      />
    </>
  );
}

export default App;
