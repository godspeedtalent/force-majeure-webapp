/**
 * User Metrics Hook
 *
 * React Query hooks for fetching user metrics and analytics data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import type {
  UserMetricsOverview,
  UserGrowthDataPoint,
  UserEngagement,
  TopUsersBySpend,
  UsersByCity,
  UserActivityByDay,
} from './types';

// ============================================================================
// Query Keys
// ============================================================================

export const userMetricsKeys = {
  all: ['user-metrics'] as const,
  overview: (dateRange: { start: Date; end: Date }) =>
    [...userMetricsKeys.all, 'overview', dateRange.start.toISOString(), dateRange.end.toISOString()] as const,
  growth: (months: number) => [...userMetricsKeys.all, 'growth', months] as const,
  engagement: () => [...userMetricsKeys.all, 'engagement'] as const,
  topSpenders: (limit: number) => [...userMetricsKeys.all, 'top-spenders', limit] as const,
  byCity: () => [...userMetricsKeys.all, 'by-city'] as const,
  dailyActivity: (dateRange: { start: Date; end: Date }) =>
    [...userMetricsKeys.all, 'daily-activity', dateRange.start.toISOString(), dateRange.end.toISOString()] as const,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getDateRangeForMonths(months: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  return { start, end };
}

// ============================================================================
// Query Functions
// ============================================================================

async function fetchUserMetricsOverview(dateRange: { start: Date; end: Date }): Promise<UserMetricsOverview> {
  // Use past 30 days instead of calendar month for more accurate recent data
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  sixtyDaysAgo.setHours(0, 0, 0, 0);

  // Total users
  const { count: totalUsers, error: totalError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (totalError) {
    logger.error('Failed to fetch total users', { error: totalError.message, source: 'useUserMetrics' });
    throw totalError;
  }

  // Active users (users who have made an order in date range)
  const { data: activeUsersData, error: activeError } = await supabase
    .from('orders')
    .select('user_id')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .eq('status', 'completed');

  if (activeError) {
    logger.error('Failed to fetch active users', { error: activeError.message, source: 'useUserMetrics' });
    throw activeError;
  }

  const uniqueActiveUsers = new Set(activeUsersData?.map(o => o.user_id) || []);

  // New users in the past 30 days
  const { count: newUsersPast30Days, error: newPast30Error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())
    .is('deleted_at', null);

  if (newPast30Error) {
    logger.error('Failed to fetch new users past 30 days', { error: newPast30Error.message, source: 'useUserMetrics' });
    throw newPast30Error;
  }

  // New users in the previous 30 days (30-60 days ago)
  const { count: newUsersPrevious30Days, error: newPrevious30Error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())
    .is('deleted_at', null);

  if (newPrevious30Error) {
    logger.error('Failed to fetch new users previous 30 days', { error: newPrevious30Error.message, source: 'useUserMetrics' });
    throw newPrevious30Error;
  }

  // Users with at least one completed order
  const { data: usersWithOrdersData, error: usersWithOrdersError } = await supabase
    .from('orders')
    .select('user_id')
    .eq('status', 'completed');

  if (usersWithOrdersError) {
    logger.error('Failed to fetch users with orders', { error: usersWithOrdersError.message, source: 'useUserMetrics' });
    throw usersWithOrdersError;
  }

  const uniqueUsersWithOrders = new Set(usersWithOrdersData?.map(o => o.user_id) || []);
  const usersWithOrders = uniqueUsersWithOrders.size;

  // Calculate average orders per user
  const totalOrders = usersWithOrdersData?.length || 0;
  const averageOrdersPerUser = usersWithOrders > 0 ? totalOrders / usersWithOrders : 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: uniqueActiveUsers.size,
    newUsersPast30Days: newUsersPast30Days || 0,
    newUsersPrevious30Days: newUsersPrevious30Days || 0,
    usersWithOrders,
    averageOrdersPerUser: Math.round(averageOrdersPerUser * 100) / 100,
  };
}

async function fetchUserGrowth(months: number): Promise<UserGrowthDataPoint[]> {
  const { start } = getDateRangeForMonths(months);

  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', start.toISOString())
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch user growth data', { error: error.message, source: 'useUserMetrics' });
    throw error;
  }

  // Group by month
  const byMonth: Record<string, number> = {};

  // Initialize all months in range
  const currentDate = new Date(start);
  while (currentDate <= new Date()) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    byMonth[monthKey] = 0;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Count users per month
  (data || []).forEach(profile => {
    const date = new Date(profile.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (byMonth[monthKey] !== undefined) {
      byMonth[monthKey]++;
    }
  });

  // Get total users before the start date for cumulative calculation
  const { count: previousUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', start.toISOString())
    .is('deleted_at', null);

  // Convert to array with cumulative totals
  let cumulative = previousUsers || 0;
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, newUsers]) => {
      cumulative += newUsers;
      return {
        month: new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        newUsers,
        cumulativeUsers: cumulative,
      };
    });
}

async function fetchTopSpenders(limit: number): Promise<TopUsersBySpend[]> {
  // Get all completed orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('user_id, total_cents')
    .eq('status', 'completed');

  if (ordersError) {
    logger.error('Failed to fetch orders for top spenders', { error: ordersError.message, source: 'useUserMetrics' });
    throw ordersError;
  }

  // Aggregate by user first
  const userSpending: Record<string, { totalSpent: number; orderCount: number }> = {};

  (ordersData || [])
    .filter((order): order is typeof order & { user_id: string } => order.user_id !== null)
    .forEach(order => {
      const userId = order.user_id;
      if (!userSpending[userId]) {
        userSpending[userId] = { totalSpent: 0, orderCount: 0 };
      }
      userSpending[userId].totalSpent += order.total_cents;
      userSpending[userId].orderCount++;
    });

  // Get top user IDs
  const topUserIds = Object.entries(userSpending)
    .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
    .slice(0, limit)
    .map(([userId]) => userId);

  // Fetch profile info for top users
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, email')
    .in('user_id', topUserIds);

  if (profilesError) {
    logger.error('Failed to fetch profiles for top spenders', { error: profilesError.message, source: 'useUserMetrics' });
    throw profilesError;
  }

  // Build profile lookup
  const profileLookup: Record<string, { display_name: string | null; email: string | null }> = {};
  (profilesData || []).forEach(profile => {
    profileLookup[profile.user_id] = {
      display_name: profile.display_name,
      email: profile.email,
    };
  });

  // Convert to array with profile data
  return topUserIds.map(userId => ({
    userId,
    displayName: profileLookup[userId]?.display_name || null,
    email: profileLookup[userId]?.email || null,
    totalSpent: userSpending[userId].totalSpent / 100, // Convert cents to dollars
    orderCount: userSpending[userId].orderCount,
  }));
}

async function fetchUsersByCity(): Promise<UsersByCity[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('home_city')
    .is('deleted_at', null)
    .not('home_city', 'is', null);

  if (error) {
    logger.error('Failed to fetch users by city', { error: error.message, source: 'useUserMetrics' });
    throw error;
  }

  // Count by city
  const cityCount: Record<string, number> = {};
  let total = 0;

  (data || []).forEach(profile => {
    const city = profile.home_city || 'Unknown';
    cityCount[city] = (cityCount[city] || 0) + 1;
    total++;
  });

  // Convert to array with percentages
  return Object.entries(cityCount)
    .map(([city, count]) => ({
      city,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 cities
}

async function fetchDailyActivity(dateRange: { start: Date; end: Date }): Promise<UserActivityByDay[]> {
  // Fetch signups
  const { data: signupData, error: signupError } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .is('deleted_at', null);

  if (signupError) {
    logger.error('Failed to fetch signup activity', { error: signupError.message, source: 'useUserMetrics' });
    throw signupError;
  }

  // Fetch orders
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .eq('status', 'completed');

  if (orderError) {
    logger.error('Failed to fetch order activity', { error: orderError.message, source: 'useUserMetrics' });
    throw orderError;
  }

  // Fetch page view activity (sessions) as a proxy for engagement
  const { data: sessionData, error: sessionError } = await supabase
    .from('analytics_sessions')
    .select('created_at')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .not('user_id', 'is', null);

  if (sessionError) {
    logger.error('Failed to fetch session activity', { error: sessionError.message, source: 'useUserMetrics' });
    throw sessionError;
  }

  // Group by day
  const byDay: Record<string, { signups: number; orders: number; sessions: number }> = {};

  // Initialize days in range
  const currentDate = new Date(dateRange.start);
  while (currentDate <= dateRange.end) {
    const dayKey = currentDate.toISOString().split('T')[0];
    byDay[dayKey] = { signups: 0, orders: 0, sessions: 0 };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count signups
  (signupData || []).forEach(profile => {
    const dayKey = profile.created_at.split('T')[0];
    if (byDay[dayKey]) {
      byDay[dayKey].signups++;
    }
  });

  // Count orders
  (orderData || []).forEach(order => {
    const dayKey = order.created_at.split('T')[0];
    if (byDay[dayKey]) {
      byDay[dayKey].orders++;
    }
  });

  // Count sessions (logged-in user sessions)
  (sessionData || []).forEach(session => {
    const dayKey = session.created_at.split('T')[0];
    if (byDay[dayKey]) {
      byDay[dayKey].sessions++;
    }
  });

  // Convert to array
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, counts]) => ({
      day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...counts,
    }));
}

async function fetchUserEngagement(): Promise<UserEngagement[]> {
  // Get recent users with their order data
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, email, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (profileError) {
    logger.error('Failed to fetch profiles for engagement', { error: profileError.message, source: 'useUserMetrics' });
    throw profileError;
  }

  // Get order data for these users
  const userIds = (profiles || []).map(p => p.user_id);

  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('user_id, total_cents, created_at')
    .in('user_id', userIds)
    .eq('status', 'completed');

  if (orderError) {
    logger.error('Failed to fetch orders for engagement', { error: orderError.message, source: 'useUserMetrics' });
    throw orderError;
  }

  // Get last activity from activity logs
  const { data: activityLogs, error: activityError } = await supabase
    .from('activity_logs')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (activityError) {
    logger.error('Failed to fetch activity logs for engagement', { error: activityError.message, source: 'useUserMetrics' });
    throw activityError;
  }

  // Build user activity map
  const lastActivity: Record<string, string> = {};
  (activityLogs || []).forEach(log => {
    if (log.user_id && !lastActivity[log.user_id]) {
      lastActivity[log.user_id] = log.created_at;
    }
  });

  // Build engagement data
  const ordersByUser: Record<string, { count: number; total: number; lastOrder: string | null }> = {};
  (orders || [])
    .filter((order): order is typeof order & { user_id: string } => order.user_id !== null)
    .forEach(order => {
      const userId = order.user_id;
      if (!ordersByUser[userId]) {
        ordersByUser[userId] = { count: 0, total: 0, lastOrder: null };
      }
      ordersByUser[userId].count++;
      ordersByUser[userId].total += order.total_cents;
      if (!ordersByUser[userId].lastOrder || order.created_at > ordersByUser[userId].lastOrder!) {
        ordersByUser[userId].lastOrder = order.created_at;
      }
    });

  return (profiles || []).map(profile => ({
    userId: profile.user_id,
    displayName: profile.display_name,
    email: profile.email,
    createdAt: profile.created_at,
    orderCount: ordersByUser[profile.user_id]?.count || 0,
    totalSpent: (ordersByUser[profile.user_id]?.total || 0) / 100,
    lastOrderDate: ordersByUser[profile.user_id]?.lastOrder || null,
    lastActivityDate: lastActivity[profile.user_id] || null,
  }));
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch user metrics overview stats
 */
export function useUserMetricsOverview(dateRange: { start: Date; end: Date }) {
  return useQuery<UserMetricsOverview, Error>({
    queryKey: userMetricsKeys.overview(dateRange),
    queryFn: () => fetchUserMetricsOverview(dateRange),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch user growth data over time
 */
export function useUserGrowth(months: number = 12) {
  return useQuery<UserGrowthDataPoint[], Error>({
    queryKey: userMetricsKeys.growth(months),
    queryFn: () => fetchUserGrowth(months),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Fetch top spenders
 */
export function useTopSpenders(limit: number = 10) {
  return useQuery<TopUsersBySpend[], Error>({
    queryKey: userMetricsKeys.topSpenders(limit),
    queryFn: () => fetchTopSpenders(limit),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Fetch users by city
 */
export function useUsersByCity() {
  return useQuery<UsersByCity[], Error>({
    queryKey: userMetricsKeys.byCity(),
    queryFn: () => fetchUsersByCity(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Fetch daily activity
 */
export function useDailyActivity(dateRange: { start: Date; end: Date }) {
  return useQuery<UserActivityByDay[], Error>({
    queryKey: userMetricsKeys.dailyActivity(dateRange),
    queryFn: () => fetchDailyActivity(dateRange),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch user engagement data
 */
export function useUserEngagement() {
  return useQuery<UserEngagement[], Error>({
    queryKey: userMetricsKeys.engagement(),
    queryFn: () => fetchUserEngagement(),
    staleTime: 60000, // 1 minute
  });
}