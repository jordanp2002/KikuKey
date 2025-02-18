"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Helper function to handle user display name update
const updateUserDisplayName = async (supabase: any, user: any) => {
  if (user.app_metadata.provider === 'google') {
    // Get display name from Google identity data
    const displayName = user.identities?.[0]?.identity_data?.full_name || 
                      user.identities?.[0]?.identity_data?.name ||
                      user.identities?.[0]?.identity_data?.email?.split('@')[0];
                      
    if (displayName) {
      await supabase.auth.updateUser({
        data: {
          display_name: displayName
        }
      });
    }
  }
};

// Auth callback handler
export const handleAuthCallback = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      await updateUserDisplayName(supabase, session.user);
    }

    if (error) {
      return redirect(`${origin}/sign-in?error=true&message=${encodeURIComponent(error.message)}`);
    }
  }

  if (redirectTo) {
    return redirect(`${origin}${redirectTo}`);
  }

  return redirect(`${origin}/protected`);
};

// Email/Password Sign Up
export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("displayName")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !displayName) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email, password, and display name are required",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        display_name: displayName
      }
    },
  });

  if (error) {
    console.error('Signup error:', error);
    return encodedRedirect("error", "/sign-up", error.message);
  } else if (data.user?.identities?.length === 0) {
    return encodedRedirect("error", "/sign-up", "Email already exists");
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

// Email/Password Sign In
export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const insertVideoLog = async (startTime: string, endTime: string) => {
  const supabase = await createClient();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
 
  if (durationMinutes < 5) {
    return;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user:', userError);
    return { error: userError };
  }

  const { data, error } = await supabase
    .from('Logs')
    .insert([
      {
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting video log:', error);
    return { error };
  }

  return { data };
};

export const insertMangaLog = async (startTime: string, endTime: string) => {
  const supabase = await createClient();

  // Calculate duration in minutes
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < 5) {
    return;
  }

  // Check if duration is less than 5 minutes
 
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user:', userError);
    return { error: userError };
  }

  const { data, error } = await supabase
    .from('MangaLogs')
    .insert([
      {
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting manga log:', error);
    return { error };
  }

  return { data };
};

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ContentType = 'video' | 'manga' | 'total';

export const insertGoal = async (
  contentType: ContentType,
  period: GoalPeriod,
  targetMinutes: number
) => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user:', userError);
    return { error: userError };
  }

  // First check if a goal already exists for this combination
  const { data: existingGoal } = await supabase
    .from('goals')
    .select()
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('period', period)
    .single();

  if (existingGoal) {
    // Update existing goal
    const { data, error } = await supabase
      .from('Goals')
      .update({
        target_minutes: targetMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingGoal.id)
      .select();

    if (error) {
      console.error('Error updating goal:', error);
      return { error };
    }

    return { data };
  } else {
    // Insert new goal
    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: user.id,
          content_type: contentType,
          period: period,
          target_minutes: targetMinutes,
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting goal:', error);
      return { error };
    }

    return { data };
  }
};

export type LeaderboardPeriod = 'daily' | 'monthly' | 'yearly' | 'all-time';
export type LeaderboardType = 'total' | 'listening' | 'reading';

export interface LeaderboardEntry {
  username: string;
  user_id: string;
  total_reading?: number;
  total_listening?: number;
  total_immersion: number;
}

interface UserProgressLog {
  user_id: string;
  reading_minutes: number;
  listening_minutes: number;
  total_minutes: number;
  date: string;
  auth_users: {
    profiles: {
      username: string;
    }[];
  };
}

interface UserProgress {
  user_id: string;
  total_reading_minutes: number;
  total_listening_minutes: number;
  total_minutes: number;
  auth_users: {
    profiles: {
      username: string;
    }[];
  };
}

export const getLeaderboard = async (
  period: LeaderboardPeriod,
  type: LeaderboardType
): Promise<{ data: LeaderboardEntry[] | null; error: any }> => {
  const supabase = await createClient();
  console.log('Fetching leaderboard for period:', period, 'type:', type);

  if (period === 'all-time') {
    const { data, error } = await supabase
      .from('UserProgress')
      .select(`
        id,
        user_id,
        total_reading_minutes,
        total_listening_minutes,
        total_minutes,
        profiles!inner (
          username
        )
      `) 
      .order('total_minutes', { ascending: false })
      .limit(10);

    console.log('All-time query result:', { data, error });

    if (error) return { data: null, error };

    const typedData = data as any[];
    const mappedData = typedData.map(entry => ({
      username: entry.profiles ? entry.profiles.username : 'Unknown User',
      user_id: entry.profiles?.id || entry.user_id,
      total_reading: entry.total_reading_minutes || 0,
      total_listening: entry.total_listening_minutes || 0,
      total_immersion: entry.total_minutes || 0
    }));

    console.log('All-time mapped data:', mappedData);

    return {
      data: mappedData,
      error: null
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let dateFilter;

  if (period === 'daily') {
    dateFilter = today.toISOString().split('T')[0];
    console.log('Filtering for date:', dateFilter);
  } else if (period === 'monthly') {
    dateFilter = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    console.log('Filtering from date:', dateFilter);
  } else if (period === 'yearly') {
    dateFilter = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    console.log('Filtering from date:', dateFilter);
  }

  const query = supabase
    .from('UserProgressLogs')
    .select(`
      *,
      profiles (
        id,
        username
      )
    `)
    .order('total_minutes', { ascending: false });

  if (period === 'daily') {
    query.eq('date', dateFilter);
  } else {
    query.gte('date', dateFilter);
  }

  const { data, error } = await query;
  console.log('Query result:', { data, error });

  if (error) return { data: null, error };

  const typedData = data as any[];
  
  // Group and aggregate the results by profile_id
  const aggregatedData = typedData.reduce((acc: { [key: string]: LeaderboardEntry }, curr) => {
    const profileId = curr.profiles?.id || curr.user_id;
    if (!acc[profileId]) {
      acc[profileId] = {
        username: curr.profiles ? curr.profiles.username : 'Unknown User',
        user_id: profileId,
        total_reading: 0,
        total_listening: 0,
        total_immersion: 0
      };
    }

    acc[profileId].total_reading! += curr.reading_minutes || 0;
    acc[profileId].total_listening! += curr.listening_minutes || 0;
    acc[profileId].total_immersion += curr.total_minutes || 0;

    return acc;
  }, {});

  console.log('Aggregated data:', aggregatedData);

  // Sort by the selected type and take top 10
  const sortedData = Object.values(aggregatedData)
    .sort((a, b) => {
      const aValue = type === 'reading' ? a.total_reading! :
                    type === 'listening' ? a.total_listening! :
                    a.total_immersion;
      const bValue = type === 'reading' ? b.total_reading! :
                    type === 'listening' ? b.total_listening! :
                    b.total_immersion;
      return bValue - aValue;
    })
    .slice(0, 10);

  console.log('Final sorted data:', sortedData);

  return {
    data: sortedData,
    error: null
  };
};
