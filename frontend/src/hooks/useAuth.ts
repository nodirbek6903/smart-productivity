import { useSelector } from "react-redux";
import { RootState } from "../app/store";
export const useAuth = () => {
  const { user, token, loading } = useSelector(
    (state: RootState) => state.auth
  );

  return { user, token, loading, isAuthenticated: Boolean(token) };
};
