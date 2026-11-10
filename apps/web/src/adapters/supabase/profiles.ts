import type { MyProfile, ProfileRepository } from '@/core/profile';
import type { AppSupabaseClient } from './client';

const MY_PROFILE_COLUMNS = 'id, display_name, time_zone, locale';

type MyProfileRow = {
  id: string;
  display_name: string;
  time_zone: string;
  locale: string;
};

function toMyProfile(row: MyProfileRow): MyProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    timeZone: row.time_zone,
    locale: row.locale,
  };
}

export function createSupabaseProfiles(client: AppSupabaseClient): ProfileRepository {
  return {
    async getMine(userId) {
      const { data, error } = await client
        .from('profiles')
        .select(MY_PROFILE_COLUMNS)
        .eq('id', userId)
        .single();
      if (error) throw error;
      return toMyProfile(data);
    },

    async updateDisplayName(userId, displayName) {
      const { data, error } = await client
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId)
        .select(MY_PROFILE_COLUMNS)
        .single();
      if (error) throw error;
      return toMyProfile(data);
    },

    async setTimeZone(timeZone) {
      const { data, error } = await client.rpc('set_time_zone', {
        requested_time_zone: timeZone,
      });
      if (error) throw error;
      return data;
    },
  };
}
