import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseAuthEnabled } from "@/lib/firebase";
import { getMe, setAuthTokenProvider, type BackendRole } from "@/lib/modus-api";

type AuthStatus = "disabled" | "loading" | "signed-in" | "signed-out";

type AuthContextValue = {
  /** "disabled" = no hay proyecto Firebase configurado; la app usa el toggle de rol local. */
  status: AuthStatus;
  enabled: boolean;
  email: string | null;
  displayName: string | null;
  /** Rol resuelto por el backend (custom claim o documento usuarios/{uid}). */
  role: BackendRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isFirebaseAuthEnabled ? "loading" : "disabled");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<BackendRole | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus("disabled");
      return;
    }

    // El resto de la app pide el ID token a través de este proveedor.
    setAuthTokenProvider(async () => {
      const current = auth.currentUser;
      return current ? current.getIdToken() : null;
    });

    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setStatus("signed-out");
        return;
      }
      try {
        const me = await getMe();
        setRole(me?.rol ?? null);
      } catch {
        setRole(null);
      }
      setStatus("signed-in");
    });

    return () => {
      unsub();
      setAuthTokenProvider(null);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth no está configurado en este entorno.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      enabled: isFirebaseAuthEnabled,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      role,
      signIn,
      signOutUser,
    }),
    [status, user, role, signIn, signOutUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Provider ausente (p. ej. tests aislados): devolver un valor inerte "disabled".
    return {
      status: "disabled",
      enabled: false,
      email: null,
      displayName: null,
      role: null,
      signIn: async () => {},
      signOutUser: async () => {},
    };
  }
  return ctx;
}

/** Rol del backend → clave de vista del RoleSwitcher del frontend. */
export function roleKeyForBackendRole(
  role: BackendRole | null,
): "publico" | "privado" | "gobierno" | "entidad" {
  switch (role) {
    case "donante":
      return "privado";
    case "estado_entidad_respuesta":
      return "gobierno";
    default:
      return "publico";
  }
}
