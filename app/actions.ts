"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  const { data,error } = await supabase.auth.signUp({
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
