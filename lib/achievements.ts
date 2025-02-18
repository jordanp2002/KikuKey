import { createClient } from "@/utils/supabase/client";

export interface Achievement {
    id: string; 
    name: string;
    category: string;
    target: string;
    unlocked_at: string | null;
    current_progress: string;  
    progress_percentage: number;
}

export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
    if (!userId) {
        console.log('No user ID provided');
        return [];
    }
    console.log('User ID provided:', userId);
    const supabase = createClient();
    try {
        const rpcParams = {
            user_id_param: userId
            
        };
        console.log(rpcParams);
        const { data, error } = await supabase
            .rpc('get_user_achievements', rpcParams);
            console.log(data);
  
        if (error) {
            return [];
        }
        if (!data || !Array.isArray(data)) {
            console.log('No data received');
            return [];
        }
        const transformedData = data.map(achievement => {
            const transformed = {
                ...achievement,
                id: achievement.id.toString(),
                target: achievement.target.toString(),
                current_progress: achievement.current_progress.toString(),
                progress_percentage: Number(achievement.progress_percentage)
            };
            return transformed;
        });
        console.log('Transformed data:', transformedData);
        return transformedData;
    } catch (e) {
        return [];
    }
};