import React, { useEffect, useMemo, useState } from "react";
import { akkiourl } from "../../utils/const";
import "./akkioUsageCard.scss";
import { FaChevronRight } from "react-icons/fa6";
import { BsLightningChargeFill } from "react-icons/bs";
import { MdOutlineAccessTime } from "react-icons/md";
import { IoCubeOutline } from "react-icons/io5";

function getUserEmailFromLocalStorage() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.email) return user.email;
    return localStorage.getItem("email") || null;
  } catch (e) {
    return null;
  }
}

export default function WorkspaceUsageCard() {
  const email = useMemo(() => getUserEmailFromLocalStorage(), []);
  const [usage, setUsage] = useState({
    credits_remaining: 100,
    storage_remaining_mb: 50,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const queryParams = email ? `?user_email=${encodeURIComponent(email)}` : "";
        const resp = await fetch(`${akkiourl}/usage${queryParams}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!resp.ok) throw new Error("Failed to fetch usage");

        const data = await resp.json();
        if (!cancelled && data) {
          setUsage({
            credits_remaining: typeof data.credits_remaining === "number" ? data.credits_remaining : 100,
            storage_remaining_mb: typeof data.storage_remaining_mb === "number" ? data.storage_remaining_mb : 50,
          });
        }
      } catch (e) {
        console.error("Error loading workspace usage:", e);
      }
    }

    loadUsage();

    // Poll every 60 seconds instead of 15 to reduce load, unless critical real-time
    loadUsage();

    // Poll every 5 minutes (300000ms) as a backup sync
    const interval = setInterval(loadUsage, 300000);
    const onFocus = () => loadUsage();

    // Listen for custom event 'usage_updated' to trigger immediate refresh
    const onUsageUpdate = () => {
      console.log("Usage update event received, refreshing credits...");
      loadUsage();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("usage_updated", onUsageUpdate);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("usage_updated", onUsageUpdate);
    };
  }, [email]);

  return (
    <div className="akkioUsageCard">
      <div className="akkioUsageCard__header">
        <span className="akkioUsageCard__title">Workspace Usage</span>
      </div>

      <div className="akkioUsageCard__rows">
        <div className="akkioUsageCard__row">
          <div className="akkioUsageCard__iconWrapper">
            <BsLightningChargeFill className="akkioUsageCard__icon" />
          </div>
          <div className="akkioUsageCard__content">
            <span className="akkioUsageCard__value">{usage.credits_remaining}</span>
            <span className="akkioUsageCard__label">AI Credits</span>
          </div>
        </div>

        <div className="akkioUsageCard__row">
          <div className="akkioUsageCard__iconWrapper">
            <IoCubeOutline className="akkioUsageCard__icon" />
          </div>
          <div className="akkioUsageCard__content">
            <span className="akkioUsageCard__value">{usage.storage_remaining_mb} <small>MB</small></span>
            <span className="akkioUsageCard__label">Storage Left</span>
          </div>
        </div>
      </div>

      <button className="akkioUsageCard__upgrade">
        <span>Upgrade Plan</span>
        <FaChevronRight size={12} />
      </button>
    </div>
  );
}


