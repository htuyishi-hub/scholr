import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { ActivityItem, AuthResponse, BulkUpdateBody, CategoryViews, CreateOpportunityBody, CreateUserBody, DashboardSummary, ErrorResponse, HealthStatus, ListOpportunitiesParams, LoginBody, MessageResponse, MonthlyCount, OpportunitiesPage, OpportunitiesStats, Opportunity, SiteSettings, UpdateOpportunityBody, UpdateUserBody, User } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Login with email and password
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login with email and password
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Logout current user
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout current user
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current authenticated user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current authenticated user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List/search opportunities (public)
 */
export declare const getListOpportunitiesUrl: (params?: ListOpportunitiesParams) => string;
export declare const listOpportunities: (params?: ListOpportunitiesParams, options?: RequestInit) => Promise<OpportunitiesPage>;
export declare const getListOpportunitiesQueryKey: (params?: ListOpportunitiesParams) => readonly ["/api/opportunities", ...ListOpportunitiesParams[]];
export declare const getListOpportunitiesQueryOptions: <TData = Awaited<ReturnType<typeof listOpportunities>>, TError = ErrorType<unknown>>(params?: ListOpportunitiesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOpportunities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOpportunitiesQueryResult = NonNullable<Awaited<ReturnType<typeof listOpportunities>>>;
export type ListOpportunitiesQueryError = ErrorType<unknown>;
/**
 * @summary List/search opportunities (public)
 */
export declare function useListOpportunities<TData = Awaited<ReturnType<typeof listOpportunities>>, TError = ErrorType<unknown>>(params?: ListOpportunitiesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new opportunity (admin)
 */
export declare const getCreateOpportunityUrl: () => string;
export declare const createOpportunity: (createOpportunityBody: CreateOpportunityBody, options?: RequestInit) => Promise<Opportunity>;
export declare const getCreateOpportunityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpportunity>>, TError, {
        data: BodyType<CreateOpportunityBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOpportunity>>, TError, {
    data: BodyType<CreateOpportunityBody>;
}, TContext>;
export type CreateOpportunityMutationResult = NonNullable<Awaited<ReturnType<typeof createOpportunity>>>;
export type CreateOpportunityMutationBody = BodyType<CreateOpportunityBody>;
export type CreateOpportunityMutationError = ErrorType<unknown>;
/**
 * @summary Create a new opportunity (admin)
 */
export declare const useCreateOpportunity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpportunity>>, TError, {
        data: BodyType<CreateOpportunityBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOpportunity>>, TError, {
    data: BodyType<CreateOpportunityBody>;
}, TContext>;
/**
 * @summary Get featured/editor picks (public)
 */
export declare const getGetFeaturedOpportunitiesUrl: () => string;
export declare const getFeaturedOpportunities: (options?: RequestInit) => Promise<Opportunity[]>;
export declare const getGetFeaturedOpportunitiesQueryKey: () => readonly ["/api/opportunities/featured"];
export declare const getGetFeaturedOpportunitiesQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedOpportunities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedOpportunities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedOpportunitiesQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedOpportunities>>>;
export type GetFeaturedOpportunitiesQueryError = ErrorType<unknown>;
/**
 * @summary Get featured/editor picks (public)
 */
export declare function useGetFeaturedOpportunities<TData = Awaited<ReturnType<typeof getFeaturedOpportunities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get aggregate stats (total count, countries, categories)
 */
export declare const getGetOpportunitiesStatsUrl: () => string;
export declare const getOpportunitiesStats: (options?: RequestInit) => Promise<OpportunitiesStats>;
export declare const getGetOpportunitiesStatsQueryKey: () => readonly ["/api/opportunities/stats"];
export declare const getGetOpportunitiesStatsQueryOptions: <TData = Awaited<ReturnType<typeof getOpportunitiesStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunitiesStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOpportunitiesStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOpportunitiesStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getOpportunitiesStats>>>;
export type GetOpportunitiesStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregate stats (total count, countries, categories)
 */
export declare function useGetOpportunitiesStats<TData = Awaited<ReturnType<typeof getOpportunitiesStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunitiesStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get single opportunity by ID (public)
 */
export declare const getGetOpportunityUrl: (id: string) => string;
export declare const getOpportunity: (id: string, options?: RequestInit) => Promise<Opportunity>;
export declare const getGetOpportunityQueryKey: (id: string) => readonly [`/api/opportunities/${string}`];
export declare const getGetOpportunityQueryOptions: <TData = Awaited<ReturnType<typeof getOpportunity>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOpportunity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOpportunityQueryResult = NonNullable<Awaited<ReturnType<typeof getOpportunity>>>;
export type GetOpportunityQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get single opportunity by ID (public)
 */
export declare function useGetOpportunity<TData = Awaited<ReturnType<typeof getOpportunity>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update an opportunity (admin)
 */
export declare const getUpdateOpportunityUrl: (id: string) => string;
export declare const updateOpportunity: (id: string, updateOpportunityBody: UpdateOpportunityBody, options?: RequestInit) => Promise<Opportunity>;
export declare const getUpdateOpportunityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOpportunity>>, TError, {
        id: string;
        data: BodyType<UpdateOpportunityBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateOpportunity>>, TError, {
    id: string;
    data: BodyType<UpdateOpportunityBody>;
}, TContext>;
export type UpdateOpportunityMutationResult = NonNullable<Awaited<ReturnType<typeof updateOpportunity>>>;
export type UpdateOpportunityMutationBody = BodyType<UpdateOpportunityBody>;
export type UpdateOpportunityMutationError = ErrorType<unknown>;
/**
 * @summary Update an opportunity (admin)
 */
export declare const useUpdateOpportunity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOpportunity>>, TError, {
        id: string;
        data: BodyType<UpdateOpportunityBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateOpportunity>>, TError, {
    id: string;
    data: BodyType<UpdateOpportunityBody>;
}, TContext>;
/**
 * @summary Delete an opportunity (admin)
 */
export declare const getDeleteOpportunityUrl: (id: string) => string;
export declare const deleteOpportunity: (id: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteOpportunityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteOpportunity>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteOpportunity>>, TError, {
    id: string;
}, TContext>;
export type DeleteOpportunityMutationResult = NonNullable<Awaited<ReturnType<typeof deleteOpportunity>>>;
export type DeleteOpportunityMutationError = ErrorType<unknown>;
/**
 * @summary Delete an opportunity (admin)
 */
export declare const useDeleteOpportunity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteOpportunity>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteOpportunity>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Get opportunity by slug (public)
 */
export declare const getGetOpportunityBySlugUrl: (slug: string) => string;
export declare const getOpportunityBySlug: (slug: string, options?: RequestInit) => Promise<Opportunity>;
export declare const getGetOpportunityBySlugQueryKey: (slug: string) => readonly [`/api/opportunities/slug/${string}`];
export declare const getGetOpportunityBySlugQueryOptions: <TData = Awaited<ReturnType<typeof getOpportunityBySlug>>, TError = ErrorType<ErrorResponse>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunityBySlug>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOpportunityBySlug>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOpportunityBySlugQueryResult = NonNullable<Awaited<ReturnType<typeof getOpportunityBySlug>>>;
export type GetOpportunityBySlugQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get opportunity by slug (public)
 */
export declare function useGetOpportunityBySlug<TData = Awaited<ReturnType<typeof getOpportunityBySlug>>, TError = ErrorType<ErrorResponse>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOpportunityBySlug>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Increment view count
 */
export declare const getIncrementOpportunityViewsUrl: (id: string) => string;
export declare const incrementOpportunityViews: (id: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getIncrementOpportunityViewsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof incrementOpportunityViews>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof incrementOpportunityViews>>, TError, {
    id: string;
}, TContext>;
export type IncrementOpportunityViewsMutationResult = NonNullable<Awaited<ReturnType<typeof incrementOpportunityViews>>>;
export type IncrementOpportunityViewsMutationError = ErrorType<unknown>;
/**
 * @summary Increment view count
 */
export declare const useIncrementOpportunityViews: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof incrementOpportunityViews>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof incrementOpportunityViews>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Get related opportunities by category/country
 */
export declare const getGetRelatedOpportunitiesUrl: (id: string) => string;
export declare const getRelatedOpportunities: (id: string, options?: RequestInit) => Promise<Opportunity[]>;
export declare const getGetRelatedOpportunitiesQueryKey: (id: string) => readonly [`/api/opportunities/${string}/related`];
export declare const getGetRelatedOpportunitiesQueryOptions: <TData = Awaited<ReturnType<typeof getRelatedOpportunities>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRelatedOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRelatedOpportunities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRelatedOpportunitiesQueryResult = NonNullable<Awaited<ReturnType<typeof getRelatedOpportunities>>>;
export type GetRelatedOpportunitiesQueryError = ErrorType<unknown>;
/**
 * @summary Get related opportunities by category/country
 */
export declare function useGetRelatedOpportunities<TData = Awaited<ReturnType<typeof getRelatedOpportunities>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRelatedOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Bulk update status or delete opportunities
 */
export declare const getBulkUpdateOpportunitiesUrl: () => string;
export declare const bulkUpdateOpportunities: (bulkUpdateBody: BulkUpdateBody, options?: RequestInit) => Promise<MessageResponse>;
export declare const getBulkUpdateOpportunitiesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bulkUpdateOpportunities>>, TError, {
        data: BodyType<BulkUpdateBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof bulkUpdateOpportunities>>, TError, {
    data: BodyType<BulkUpdateBody>;
}, TContext>;
export type BulkUpdateOpportunitiesMutationResult = NonNullable<Awaited<ReturnType<typeof bulkUpdateOpportunities>>>;
export type BulkUpdateOpportunitiesMutationBody = BodyType<BulkUpdateBody>;
export type BulkUpdateOpportunitiesMutationError = ErrorType<unknown>;
/**
 * @summary Bulk update status or delete opportunities
 */
export declare const useBulkUpdateOpportunities: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bulkUpdateOpportunities>>, TError, {
        data: BodyType<BulkUpdateBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof bulkUpdateOpportunities>>, TError, {
    data: BodyType<BulkUpdateBody>;
}, TContext>;
/**
 * @summary List team members (admin)
 */
export declare const getListUsersUrl: () => string;
export declare const listUsers: (options?: RequestInit) => Promise<User[]>;
export declare const getListUsersQueryKey: () => readonly ["/api/users"];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List team members (admin)
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Invite a new team member (admin)
 */
export declare const getCreateUserUrl: () => string;
export declare const createUser: (createUserBody: CreateUserBody, options?: RequestInit) => Promise<User>;
export declare const getCreateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>;
export type CreateUserMutationBody = BodyType<CreateUserBody>;
export type CreateUserMutationError = ErrorType<unknown>;
/**
 * @summary Invite a new team member (admin)
 */
export declare const useCreateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserBody>;
}, TContext>;
/**
 * @summary Get a team member
 */
export declare const getGetUserUrl: (id: string) => string;
export declare const getUser: (id: string, options?: RequestInit) => Promise<User>;
export declare const getGetUserQueryKey: (id: string) => readonly [`/api/users/${string}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<unknown>;
/**
 * @summary Get a team member
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a team member (admin)
 */
export declare const getUpdateUserUrl: (id: string) => string;
export declare const updateUser: (id: string, updateUserBody: UpdateUserBody, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: string;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: string;
    data: BodyType<UpdateUserBody>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UpdateUserBody>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
 * @summary Update a team member (admin)
 */
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: string;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: string;
    data: BodyType<UpdateUserBody>;
}, TContext>;
/**
 * @summary Remove a team member (admin)
 */
export declare const getDeleteUserUrl: (id: string) => string;
export declare const deleteUser: (id: string, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: string;
}, TContext>;
export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>;
export type DeleteUserMutationError = ErrorType<unknown>;
/**
 * @summary Remove a team member (admin)
 */
export declare const useDeleteUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Get site settings (admin)
 */
export declare const getGetSettingsUrl: () => string;
export declare const getSettings: (options?: RequestInit) => Promise<SiteSettings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get site settings (admin)
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update site settings (admin)
 */
export declare const getUpdateSettingsUrl: () => string;
export declare const updateSettings: (siteSettings: SiteSettings, options?: RequestInit) => Promise<SiteSettings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SiteSettings>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SiteSettings>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<SiteSettings>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
 * @summary Update site settings (admin)
 */
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SiteSettings>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SiteSettings>;
}, TContext>;
/**
 * @summary Admin dashboard stats (counts, trends)
 */
export declare const getGetDashboardSummaryUrl: () => string;
export declare const getDashboardSummary: (options?: RequestInit) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Admin dashboard stats (counts, trends)
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Recent activity feed
 */
export declare const getGetDashboardActivityUrl: () => string;
export declare const getDashboardActivity: (options?: RequestInit) => Promise<ActivityItem[]>;
export declare const getGetDashboardActivityQueryKey: () => readonly ["/api/dashboard/activity"];
export declare const getGetDashboardActivityQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardActivity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardActivityQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardActivity>>>;
export type GetDashboardActivityQueryError = ErrorType<unknown>;
/**
 * @summary Recent activity feed
 */
export declare function useGetDashboardActivity<TData = Awaited<ReturnType<typeof getDashboardActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Top 5 most-viewed posts
 */
export declare const getGetTopPostsUrl: () => string;
export declare const getTopPosts: (options?: RequestInit) => Promise<Opportunity[]>;
export declare const getGetTopPostsQueryKey: () => readonly ["/api/dashboard/top-posts"];
export declare const getGetTopPostsQueryOptions: <TData = Awaited<ReturnType<typeof getTopPosts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTopPosts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTopPostsQueryResult = NonNullable<Awaited<ReturnType<typeof getTopPosts>>>;
export type GetTopPostsQueryError = ErrorType<unknown>;
/**
 * @summary Top 5 most-viewed posts
 */
export declare function useGetTopPosts<TData = Awaited<ReturnType<typeof getTopPosts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Posts created per month (last 6 months)
 */
export declare const getGetPostsByMonthUrl: () => string;
export declare const getPostsByMonth: (options?: RequestInit) => Promise<MonthlyCount[]>;
export declare const getGetPostsByMonthQueryKey: () => readonly ["/api/dashboard/posts-by-month"];
export declare const getGetPostsByMonthQueryOptions: <TData = Awaited<ReturnType<typeof getPostsByMonth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPostsByMonth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPostsByMonth>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPostsByMonthQueryResult = NonNullable<Awaited<ReturnType<typeof getPostsByMonth>>>;
export type GetPostsByMonthQueryError = ErrorType<unknown>;
/**
 * @summary Posts created per month (last 6 months)
 */
export declare function useGetPostsByMonth<TData = Awaited<ReturnType<typeof getPostsByMonth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPostsByMonth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Total views grouped by category
 */
export declare const getGetViewsByCategoryUrl: () => string;
export declare const getViewsByCategory: (options?: RequestInit) => Promise<CategoryViews[]>;
export declare const getGetViewsByCategoryQueryKey: () => readonly ["/api/dashboard/views-by-category"];
export declare const getGetViewsByCategoryQueryOptions: <TData = Awaited<ReturnType<typeof getViewsByCategory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getViewsByCategory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getViewsByCategory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetViewsByCategoryQueryResult = NonNullable<Awaited<ReturnType<typeof getViewsByCategory>>>;
export type GetViewsByCategoryQueryError = ErrorType<unknown>;
/**
 * @summary Total views grouped by category
 */
export declare function useGetViewsByCategory<TData = Awaited<ReturnType<typeof getViewsByCategory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getViewsByCategory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map