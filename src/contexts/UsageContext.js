import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { akkiourl } from '../utils/const';

const UsageContext = createContext(null);

export function UsageProvider({ children }) {
  const [usage, setUsage] = useState({
    credits_remaining: 0,
    storage_remaining_mb: 0,
    loading: true,
  });

  const email = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.email) return user.email;
      return localStorage.getItem("email") || null;
    } catch (e) {
      return null;
    }
  }, []);

  const loadUsage = async () => {
    // try {
    //   const queryParams = email ? `?user_email=${encodeURIComponent(email)}` : "";
    //   // Adjust if akkiourl already includes /api or not. Typically const.js has base url.
    //   // Based on WorkspaceUsageCard.jsx it uses `${akkiourl}/usage`.
    //   const resp = await fetch(`${akkiourl}/usage${queryParams}`, {
    //     method: "GET",
    //     headers: { "Content-Type": "application/json" },
    //   });

    //   if (!resp.ok) throw new Error("Failed to fetch usage");

    //   const data = await resp.json();
    //   if (data) {
    //     setUsage({
    //       credits_remaining: typeof data.credits_remaining === "number" ? data.credits_remaining : 0,
    //       storage_remaining_mb: typeof data.storage_remaining_mb === "number" ? data.storage_remaining_mb : 0,
    //       loading: false,
    //     });
    //   }
    // } catch (e) {
    //   console.error("Error loading workspace usage:", e);
    //   setUsage(prev => ({ ...prev, loading: false }));
    // }
  };

  // useEffect(() => {
  //   loadUsage();

  //   // Event listener for manual updates
  //   const onUsageUpdate = () => loadUsage();
  //   window.addEventListener("usage_updated", onUsageUpdate);
  //   window.addEventListener("focus", onUsageUpdate);

  //   return () => {
  //     window.removeEventListener("usage_updated", onUsageUpdate);
  //     window.removeEventListener("focus", onUsageUpdate);
  //   };
  // }, [email]);

  return (
    <UsageContext.Provider value={{ ...usage, refreshUsage: loadUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}

