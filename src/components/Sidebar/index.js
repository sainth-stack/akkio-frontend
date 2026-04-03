/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo } from "react";
import "./akkioSidebar.scss";
import "./akkioSidebarLayout.scss";
import { Link, useLocation } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { FaBrain, FaPuzzlePiece } from "react-icons/fa6";
import WorkspaceUsageCard from "./WorkspaceUsageCard";

const MENU_ITEMS = [
  { name: 'Home', icon: IoHome, path: '/welcome', id: 1, permission: 'home' },
  { name: 'Multi Agent', icon: FaBrain, path: '/multi-agent', permission: 'reports' },
  { name: 'App Builder', icon: FaPuzzlePiece, path: '/app-builder', permission: 'reports' },
];

export default function Sidebar() {
  const location = useLocation();

  const hasPermission = (feature) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      if (!userData?.roles) return true;
      const allPermissions = new Set(userData.roles.flatMap(role => role.permissions || []));
      return allPermissions.has(`${feature}_read`) || allPermissions.has(`${feature}_write`) ||
        [...allPermissions].some(p => p.startsWith(`${feature}_`));
    } catch (e) {
      return true;
    }
  };

  const menuItems = useMemo(() => {
    return MENU_ITEMS.map(item => {
      return hasPermission(item.permission) ? item : null;
    }).filter(Boolean);
  }, [location.pathname]);

  const isActive = (item) => {
    if (item.name === "App Builder" && (location.pathname === "/app-builder" || location.pathname.startsWith("/app-builder/"))) {
      return true;
    }
    return location.pathname === item.path;
  };

  return (
    <div className="akkioSidebar akkioSidebarLayout akkioSidebarLayout--main shadow">
      <div className="akkioSidebar__header">
      </div>
      <hr className="akkioSidebar__divider" />

      <ul className="akkioSidebar__list" id="menu">
        {menuItems.map((item) => {
          return (
            <div key={item.name}>
              <li
                className={`akkioSidebar__item ${isActive(item) ? "akkioSidebar__item--active" : ""}`}
              >
                <Link
                  to={item.path}
                  className="akkioSidebar__link"
                >
                  <item.icon size={20} className="akkioSidebar__icon" />
                  <span className="akkioSidebar__text">{item.name}</span>
                </Link>
              </li>
            </div>
          );
        })}
      </ul>

      <div className="akkioSidebar__footer">
        <WorkspaceUsageCard />
      </div>
    </div>
  );
}
