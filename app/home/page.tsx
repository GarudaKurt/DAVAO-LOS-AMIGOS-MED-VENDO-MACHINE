"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/components/home-header/HomeHeader";
import SosButton from "@/components/sos-button/SosAlert";
import StatusIndicator from "@/components/status-indicator/StatusIndicator";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { useFallStatus } from "@/hooks/useFullStatus";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const supabase = createClient();

  const { hasFall, fullname } = useFallStatus();

  const [manualActive, setManualActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sosActive = manualActive ?? hasFall;

  // Once the realtime hook receives a new database value, let it become the
  // source of truth again instead of keeping the previous local override.
  useEffect(() => {
    setManualActive(null);
  }, [hasFall]);

  const handleSosPress = async () => {
    // Toggle the state the user actually sees. The alert may come from the
    // device (`hasFall`) rather than the local manual state.
    const nextState = !sosActive;
    setManualActive(nextState); // optimistic UI update
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("No authenticated user found.");
      }

      // Base update: just the hasFall flag
      const { error: updateError } = await supabase
        .from("patient_status")
        .update({ hasFall: nextState })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

    } catch (err) {
      const errorObject = err as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      } | null;
      const message = [
        errorObject?.message,
        errorObject?.details,
        errorObject?.hint,
        errorObject?.code ? `code ${errorObject.code}` : undefined,
      ]
        .filter(Boolean)
        .join(" | ") || (err instanceof Error ? err.message : String(err));
      console.error("Failed to update hasFall:", message);
      setError("Could not send alert. Please try again.");
      setManualActive(!nextState); // revert optimistic update on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <HomeHeader name={fullname || "there"} hasNotification />

      <main className="flex flex-1 flex-col items-center px-6 pt-6 text-center">
        <StatusIndicator alert={sosActive} />

        {sosActive ? (
          <p className="mt-3 text-sm text-neutral-600">
            <span className="font-semibold text-red-500">Alert sent.</span> Help is on
            the way — stay where you are if possible.
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-600">
            Help is just is in everywhere! If{" "}
            <span className="font-semibold text-red-500">SOS alert</span> occurs someone
            call the help.
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <div className="flex flex-1 items-center justify-center">
          <SosButton active={sosActive} onPress={handleSosPress}/>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
