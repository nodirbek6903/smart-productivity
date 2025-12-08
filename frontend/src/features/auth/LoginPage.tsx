import { useState } from "react";
import { TextField, Button, Card, Typography } from "@mui/material";
import { useLoginMutation, useMeQuery } from "../../api/authApi";
import { useAppDispatch } from "../../app/hooks";
import { setToken, setUser } from "./authSlice";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();
  const { refetch: fetchMe } = useMeQuery(undefined, { skip: true });

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Login → token olamiz
      const res = await login(form).unwrap();

      const token = res?.data?.token;
      if (!token) {
        alert("Token kelmadi. Backendni tekshiring.");
        return;
      }

      // 2. Tokenni redux + localStorage ga yozamiz
      dispatch(setToken(token));

      // 3. endi user maʼlumotlarini olamiz
      const meRes = await fetchMe().unwrap();

      const user = meRes?.data;
      dispatch(setUser(user));

      // 4. Role bo'yicha redirect
      if (user.role.name === "ADMIN") navigate("/admin");
      else if (user.role.name === "MANAGER") navigate("/manager");
      else navigate("/user");

    } catch (err: any) {
      console.log(err);
      alert(err?.data?.message || "Login xatolik");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f6fa",
      }}
    >
      <Card style={{ width: 380, padding: 30 }}>
        <Typography variant="h5" textAlign="center" mb={3}>
          Smart Productivity — Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Parol"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? "Kirish..." : "Kirish"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
