export type MyProfile = {
  id: string;
  displayName: string;
  timeZone: string;
  locale: string;
};

export interface ProfileRepository {
  getMine(userId: string): Promise<MyProfile>;
  updateDisplayName(userId: string, displayName: string): Promise<MyProfile>;
  setTimeZone(timeZone: string): Promise<string>;
}
