// userModel.js
import { Phone } from "lucide-react";

export const userModel = {
  auth_data: {
    uid: null,
    email: null,
    displayName: null,
    emailVerified: false,
    photoURL: null,
  },
  prefs: {
    has_completed_onboarding: false,
    preferred_language: "he",
    theme_preference: "light",
    voice_profile: {},
    last_login_method: "", // "popup" | "redirect"
    last_login_time: null,
    drawer_swipe_rtl: true, // Drawer swipe direction: true = Right → Left (default)
  },
  data: {
    id_number: "",
    passport: "",
    email: "",
    full_name: "",
    phone: "",

    business_name: "", // NEW

    role: "owner", // owner | manager | employee

    created_at: null,
    updated_at: null,
    is_admin: false,
    is_developer: false,

    street: "",
    city: "",
    zip: "",
    country: "Israel",
  },
};
