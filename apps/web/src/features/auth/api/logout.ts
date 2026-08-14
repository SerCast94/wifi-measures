import apiClient from "@/core/lib/apiClient";

const VERSION = "v1";

export const logout = async () => {
  await apiClient.post(`${VERSION}/auth/logout`);
};
