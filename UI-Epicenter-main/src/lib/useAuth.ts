// hooks/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import api from "./axiosInstance";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  status: boolean;
  statusCode: string;
  message: string;
  data: {
    token: string;
    roles: { id: number; name: string }[];
    userId: number;
    userName: string;
    email: string;
    partnerId: string;
    partnerName?: string | null; // Optional field for partner name
  };
}

type LoginData = LoginResponse["data"];

export function useLogin() {
  const setUser = useUserStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation<LoginData, Error, LoginPayload>(
    {
      mutationFn: async (credentials) => {
        const response = await api.post<LoginResponse>(
          "/Auth/login",
          credentials
        );
        if (!response.data.status) {
          throw new Error(response.data.message || "Login failed");
        }
        return response.data.data;
      },
      onSuccess: (data) => {

        document.cookie = `authToken=${data.token}; path=/`;
        document.cookie = `roles=${data.roles
          .map((r) => r.name)
          .join(",")}; path=/`;
        setUser({
          token: data.token,
          roles: data.roles,
          userId: data.userId,
          userName: data.userName,
          email: data.email,
          partnerId: data?.partnerId || null,
          partnerName: data?.partnerName || "", // Optional field for partner name
        });
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      },
      onError: (data) => {
        toast.error(data.message)
      },
    },
    queryClient
  );
}
