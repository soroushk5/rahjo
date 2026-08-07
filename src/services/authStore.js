const AUTH_KEY = "rahjo.demo.session.v1";

export const demoCredentials = Object.freeze({
  email: "demo@rahjo.ir",
  password: "RahjoDemo1405"
});

const demoSession = Object.freeze({
  user: {
    name: "کاربر دمو",
    email: demoCredentials.email,
    role: "مدیر دسترسی داده",
    organization: "شرکت نمونه سازمانی",
    initials: "ر"
  },
  environment: "Sandbox",
  signedInAt: "demo"
});

/** @returns {Storage | null} */
function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** @returns {typeof demoSession | null} */
export function getSession() {
  const target = storage();
  if (!target) return null;
  try {
    const raw = target.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.user?.email !== demoCredentials.email) return null;
    return {
      ...demoSession,
      signedInAt: typeof parsed.signedInAt === "string" ? parsed.signedInAt : "demo"
    };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getSession());
}

/** @param {string} email @param {string} password */
export function signIn(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== demoCredentials.email || password !== demoCredentials.password) {
    return { ok: false, message: "ایمیل یا رمز عبور محیط نمایشی درست نیست." };
  }

  const session = { ...demoSession, signedInAt: new Date().toISOString() };
  const target = storage();
  if (target) {
    try {
      target.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {
      // Session persistence is optional for the static demo.
    }
  }
  return { ok: true, session };
}

export function signOut() {
  const target = storage();
  if (!target) return;
  try {
    target.removeItem(AUTH_KEY);
  } catch {
    // No-op in restricted browser storage.
  }
}
