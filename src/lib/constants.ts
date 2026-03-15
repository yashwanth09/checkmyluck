export const SITE_NAME = "BingoBids";
export const MAX_MEMBERS_PER_GROUP = 500;
export const ENTRY_FEE = 250;
/** Refund per person when group is cancelled (you keep ENTRY_FEE - REFUND_AMOUNT) */
export const REFUND_AMOUNT = 240;
export const MAX_BIDS_PER_MEMBER = 10;
export const MAX_GROUPS_PER_DAY = 10;
export const GROUP_CLOSE_HOUR = 19; // 7 PM
export const GROUP_CLOSE_MINUTE = 0;

export const ADMIN_SECRET = (process.env.ADMIN_SECRET || "change-me-in-production").trim();

/** Indian states/UTs for profile and "Guess the State" criteria */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;
