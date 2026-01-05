/**
 * User Metrics Dashboard Types
 *
 * Type definitions for user analytics and metrics data.
 */

export interface UserMetricsOverview {
  totalUsers: number;
  activeUsers: number;
  newUsersPast30Days: number;
  newUsersPrevious30Days: number;
  usersWithOrders: number;
  averageOrdersPerUser: number;
}

export interface UserGrowthDataPoint {
  month: string;
  newUsers: number;
  cumulativeUsers: number;
}

export interface UserDemographic {
  label: string;
  value: number;
  percentage: number;
}

export interface UserEngagement {
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastActivityDate: string | null;
}

export interface UserRetention {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
}

export interface TopUsersBySpend {
  userId: string;
  displayName: string | null;
  email: string | null;
  totalSpent: number;
  orderCount: number;
}

export interface UserMetricsFilters {
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'order_count' | 'total_spent';
  sortDirection?: 'asc' | 'desc';
}

export interface UserActivityByDay {
  day: string;
  signups: number;
  orders: number;
  sessions: number;
}

export interface UsersByCity {
  city: string;
  count: number;
  percentage: number;
}