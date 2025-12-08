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
  },
  data: {
    id_number: "",
    passport: "",
    email: "",
    full_name: "",
    phone: "",
    role: "user", // user | admin
    created_at: null,
    updated_at: null,
    is_admin: false,
    is_developer: false,

    // 🏠 Address fields for payment / billing
    street: "",
    city: "",
    zip: "",
    country: "Israel",
  },
};
