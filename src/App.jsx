import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import PublicApp from "./PublicApp";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";

export default function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isAdminPage = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminPage) {
      setCheckingAuth(false);
      return;
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      setAdminUser(data.session?.user || null);
      setCheckingAuth(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAdminPage]);

  if (!isAdminPage) {
    return <PublicApp />;
  }

  if (checkingAuth) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }

  if (!adminUser) {
    return (
      <AdminLogin
        onLogin={(user) => setAdminUser(user)}
      />
    );
  }

  return (
    <Admin
      user={adminUser}
      onLogout={async () => {
        await supabase.auth.signOut();
        setAdminUser(null);
      }}
    />
  );
}