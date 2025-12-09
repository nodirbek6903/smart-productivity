import { useState } from "react";
import { authApi } from "../../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useNavigate } from "react-router-dom";
import { HiMail, HiLockClosed } from "react-icons/hi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async () => {
    if (!email || !password) {
      toast.error("Email va parolni kiriting");
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.login(email, password);

      const user = {
        _id: data.data._id,
        fullName: data.data.fullName,
        email: data.data.email,
        role: { name: data.data.role },
      };

      // Token
      const token = data.data.token;

      dispatch(setCredentials({ user, token }));

      // 🔥 SUCCESS TOAST
      toast.success(data.message || "Muvaffaqiyatli kirildi!");

      // Redirect
      navigate(`/${user.role.name.toLowerCase()}/dashboard`);
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Email yoki parol noto'g'ri";

      // 🔥 ERROR TOAST
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4">
      <div className="w-full max-w-md bg-gray-800/40 backdrop-blur-xl rounded-xl shadow-2xl p-8 border border-gray-700/50">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Tizimga kirish
        </h1>

        <div className="mb-4">
          <label className="text-gray-300 text-sm mb-2 block">Email</label>
          <div className="relative">
            <HiMail className="absolute left-3 top-3 text-gray-400 text-xl" />
            <input
              type="email"
              className="w-full pl-11 p-3 rounded-lg bg-gray-900 border border-gray-700 text-white 
                         focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="email@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-gray-300 text-sm mb-2 block">Password</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3 top-3 text-gray-400 text-xl" />

            <input
              type={showPass ? "text" : "password"}
              className="w-full pl-11 pr-11 p-3 rounded-lg bg-gray-900 border border-gray-700 text-white
                         focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition"
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold
                     shadow-lg transition disabled:opacity-50"
        >
          {loading ? "Yuklanmoqda..." : "Kirish"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Parolni unutdingizmi?{" "}
          <a href="/forgot" className="text-blue-400 hover:underline">
            Tiklash
          </a>
        </p>
      </div>
    </div>
  );
}
