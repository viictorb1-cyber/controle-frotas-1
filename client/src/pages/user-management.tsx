import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserManagement } from "@/components/user-management";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import type { User } from "@shared/schema";

export default function UserManagementPage() {
  const { user: currentUser } = useSimpleAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 30000,
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ username, password, role }: { username: string; password: string; role: "admin" | "user" }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const handleCreateUser = async (username: string, password: string, role: "admin" | "user") => {
    try {
      await createUserMutation.mutateAsync({ username, password, role });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  // Only allow admin users to access this page
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserManagement
        users={users}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
        isLoading={isLoading || createUserMutation.isPending || deleteUserMutation.isPending}
      />
    </div>
  );
}
