/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService, type UserListParams } from "@/services/user.service";
import type { CreateUserData, User } from "@/types";
import toast from "react-hot-toast";

// Query keys
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_QUERY_KEYS.all, "list"] as const,
  list: (params: UserListParams) =>
    [...USER_QUERY_KEYS.lists(), params] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  stats: () => [...USER_QUERY_KEYS.all, "stats"] as const,
  departments: () => [...USER_QUERY_KEYS.all, "departments"] as const,
};

/**
 * Hook for fetching paginated users list
 */
export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: () => UserService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching single user details
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId),
    queryFn: () => UserService.getUser(userId),
    enabled: !!userId,
  });
}

/**
 * Hook for user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: ["users", "stats"],
    queryFn: () => UserService.getUserStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for departments list
 */
export function useDepartments() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.departments(),
    queryFn: () => UserService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserData) => UserService.createUser(userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success(`User "${data.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create user";
      toast.error(message);
    },
  });
}

/**
 * Hook for updating user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: Partial<User>;
    }) => UserService.updateUser(userId, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      toast.success("User updated successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update user";
      toast.error(message);
    },
  });
}

/**
 * Hook for deleting user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success("User deleted successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete user";
      toast.error(message);
    },
  });
}

/**
 * Hook for resetting user password
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => UserService.resetUserPassword(userId),
    onSuccess: (data) => {
      toast.success(
        `Password reset successfully! New password: ${data.temporaryPassword}`
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to reset password";
      toast.error(message);
    },
  });
}

/**
 * Hook for toggling user status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => UserService.toggleUserStatus(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      toast.success(`User ${data.name} status updated successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update user status";
      toast.error(message);
    },
  });
}

/**
 * Hook for bulk uploading users
 */
export function useBulkUploadUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => UserService.bulkUploadUsers(file),
    onSuccess: (data) => {
      console.log("Bulk upload result:", data);
      //  for data we get results and credentials
      //eg {
      //         {
      //     "results": [
      //         {
      //             "email": "emma.johnson@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "liam.williams@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "olivia.brown@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "noah.davis@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "ava.martin@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "elijah.moore@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "sophia.taylor@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "lucas.anderson@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "mia.thomas@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "ethan.jackson@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "isabella.white@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "logan.harris@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "charlotte.martinez@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "james.thompson@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "amelia.robinson@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "benjamin.clark@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "harper.rodriguez@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "jacob.lewis@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "evelyn.walker@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "michael.hall@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "abigail.allen@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "alexander.young@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "ella.king@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "daniel.wright@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "grace.scott@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "matthew.green@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "scarlett.adams@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "henry.baker@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "chloe.nelson@yahoo.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "sebastian.hill@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "victoria.campbell@hotmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "jack.mitchell@gmail.com",
      //             "status": "created"
      //         },
      //         {
      //             "email": "prof.morris@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "dr.hughes@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "prof.turner@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "dr.ward@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "prof.wood@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "dr.bailey@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "prof.cooper@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "dr.rivera@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "admin.two@university.edu",
      //             "status": "created"
      //         },
      //         {
      //             "email": "",
      //             "status": "failed",
      //             "reason": "Missing required fields"
      //         }
      //     ],
      //     "credentials": [
      //         {
      //             "email": "emma.johnson@gmail.com",
      //             "password": "AhgrAsA7PH"
      //         },
      //         {
      //             "email": "liam.williams@yahoo.com",
      //             "password": "E8GVryyvFV"
      //         },
      //         {
      //             "email": "olivia.brown@hotmail.com",
      //             "password": "jSXfqW04b1"
      //         },
      //         {
      //             "email": "noah.davis@gmail.com",
      //             "password": "YK3QTEMpzY"
      //         },
      //         {
      //             "email": "ava.martin@gmail.com",
      //             "password": "oWg2Ss5JGm"
      //         },
      //         {
      //             "email": "elijah.moore@yahoo.com",
      //             "password": "lbWMBUQI+M"
      //         },
      //         {
      //             "email": "sophia.taylor@hotmail.com",
      //             "password": "zzbAfmcwiQ"
      //         },
      //         {
      //             "email": "lucas.anderson@gmail.com",
      //             "password": "QHjcupBD0/"
      //         },
      //         {
      //             "email": "mia.thomas@yahoo.com",
      //             "password": "Dy71I+kfez"
      //         },
      //         {
      //             "email": "ethan.jackson@gmail.com",
      //             "password": "/VdS9iw6kl"
      //         },
      //         {
      //             "email": "isabella.white@hotmail.com",
      //             "password": "oNK4SMuYlM"
      //         },
      //         {
      //             "email": "logan.harris@gmail.com",
      //             "password": "fMdYHRL9ye"
      //         },
      //         {
      //             "email": "charlotte.martinez@yahoo.com",
      //             "password": "UFVmqOmLYO"
      //         },
      //         {
      //             "email": "james.thompson@gmail.com",
      //             "password": "HVHgK+TcCf"
      //         },
      //         {
      //             "email": "amelia.robinson@hotmail.com",
      //             "password": "oR/HK92++W"
      //         },
      //         {
      //             "email": "benjamin.clark@gmail.com",
      //             "password": "utSJTiM8aq"
      //         },
      //         {
      //             "email": "harper.rodriguez@yahoo.com",
      //             "password": "fmhzDu+Dxn"
      //         },
      //         {
      //             "email": "jacob.lewis@gmail.com",
      //             "password": "nTVBU1f7fA"
      //         },
      //         {
      //             "email": "evelyn.walker@hotmail.com",
      //             "password": "T1I6jqr7ql"
      //         },
      //         {
      //             "email": "michael.hall@gmail.com",
      //             "password": "Dm6lm+VI4i"
      //         },
      //         {
      //             "email": "abigail.allen@yahoo.com",
      //             "password": "KCle8LC44M"
      //         },
      //         {
      //             "email": "alexander.young@gmail.com",
      //             "password": "slxO9yjGHS"
      //         },
      //         {
      //             "email": "ella.king@hotmail.com",
      //             "password": "IfZNNfAU9Z"
      //         },
      //         {
      //             "email": "daniel.wright@gmail.com",
      //             "password": "WzMWz2gPwu"
      //         },
      //         {
      //             "email": "grace.scott@yahoo.com",
      //             "password": "/h+5Xcrd9X"
      //         },
      //         {
      //             "email": "matthew.green@gmail.com",
      //             "password": "53N7xjKjRs"
      //         },
      //         {
      //             "email": "scarlett.adams@hotmail.com",
      //             "password": "HoJk/OYSvP"
      //         },
      //         {
      //             "email": "henry.baker@gmail.com",
      //             "password": "T7Dlai33E1"
      //         },
      //         {
      //             "email": "chloe.nelson@yahoo.com",
      //             "password": "Tbi1dXpeUs"
      //         },
      //         {
      //             "email": "sebastian.hill@gmail.com",
      //             "password": "dg9vqbYYvW"
      //         },
      //         {
      //             "email": "victoria.campbell@hotmail.com",
      //             "password": "dEYqhSvDbz"
      //         },
      //         {
      //             "email": "jack.mitchell@gmail.com",
      //             "password": "1Fgo3q/2NH"
      //         },
      //         {
      //             "email": "prof.morris@university.edu",
      //             "password": "MbJ7ABAB4S"
      //         },
      //         {
      //             "email": "dr.hughes@university.edu",
      //             "password": "uD93j5nmV5"
      //         },
      //         {
      //             "email": "prof.turner@university.edu",
      //             "password": "VnhfsSGbPF"
      //         },
      //         {
      //             "email": "dr.ward@university.edu",
      //             "password": "bMzBpVtSiM"
      //         },
      //         {
      //             "email": "prof.wood@university.edu",
      //             "password": "PRLTC/LpwH"
      //         },
      //         {
      //             "email": "dr.bailey@university.edu",
      //             "password": "Vfx6dMaVr8"
      //         },
      //         {
      //             "email": "prof.cooper@university.edu",
      //             "password": "blXLLowy3l"
      //         },
      //         {
      //             "email": "dr.rivera@university.edu",
      //             "password": "jZUPkOV6cl"
      //         },
      //         {
      //             "email": "admin.two@university.edu",
      //             "password": "nO10BKssxz"
      //         }
      //     ]
      // }
      // I want to store the credentials in a file
      const credentialsBlob = new Blob([JSON.stringify(data.credentials)], {
        type: "application/json",
      });
      const credentialsUrl = URL.createObjectURL(credentialsBlob);
      const link = document.createElement("a");
      link.href = credentialsUrl;
      link.download = "credentials.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(credentialsUrl);

      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success(
        `Users uploaded successfully! ${
          data.results.filter((r) => r.status === "created").length
        } users created.`
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to upload users";
      toast.error(message);
    },
  });
}

/**
 * Hook for searching users
 */
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: [...USER_QUERY_KEYS.all, "search", query],
    queryFn: () => UserService.searchUsers(query),
    enabled: !!query && query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}
