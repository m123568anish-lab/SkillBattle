/**
 * Query Configuration for React Query
 * Provides optimized cache configurations for different query types
 */

import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import API_CONFIG from "./api-config";

// Standard query cache times
export const QUERY_CACHE_CONFIG = {
  // High-frequency data that changes often
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
  },

  // Medium-frequency data
  NORMAL: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Stable data that rarely changes
  STABLE: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },

  // User profile and similar data
  USER: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // Real-time data that needs constant updates
  REALTIME: {
    staleTime: 0, // Always fresh
    gcTime: 1 * 60 * 1000, // 1 minute
  },
};

// Mutation retry strategy
export const MUTATION_CONFIG = {
  // Safe mutations that can be retried
  SAFE: {
    retry: 1,
    retryDelay: 1000,
  },

  // Mutations that shouldn't be retried
  NO_RETRY: {
    retry: 0,
  },

  // Critical mutations
  CRITICAL: {
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

// Predefined query options
export const getQueryOptions = (
  type: keyof typeof QUERY_CACHE_CONFIG
): any => ({
  staleTime: QUERY_CACHE_CONFIG[type].staleTime,
  gcTime: QUERY_CACHE_CONFIG[type].gcTime,
  retry: 1,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Predefined mutation options
export const getMutationOptions = (
  type: keyof typeof MUTATION_CONFIG
): any => ({
  retry: MUTATION_CONFIG[type].retry,
  retryDelay:
    (MUTATION_CONFIG[type] as any).retryDelay || undefined,
});
