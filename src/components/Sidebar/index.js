/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import "./akkioSidebar.scss";
import "./akkioSidebarLayout.scss";
import { Link, useLocation } from "react-router-dom";
import { IoSettingsOutline, IoHome } from "react-icons/io5";
import { FaAngleDown, FaAngleRight, FaBrain } from "react-icons/fa6";
import { BiSolidData, BiSolidAnalyse } from "react-icons/bi";
import { MdOutlineFindInPage } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { GoProjectRoadmap } from "react-icons/go";
import WorkspaceUsageCard from "./WorkspaceUsageCard";

const MENU_ITEMS = [
  { name: 'Home', icon: IoHome, path: '/welcome', id: 1, permission: 'home' },
  { name: 'Connect', icon: BiSolidData, path: '/data-source', permission: 'connect' },
  { name: 'Workspace', icon: GoProjectRoadmap, path: '/projects', id: 2, permission: 'projects' },
  { name: 'Discover', icon: BiSolidAnalyse, path: '/discover', permission: 'discover' },
  { name: 'Insights', icon: TbReportSearch, path: '/insights', permission: 'reports' },
  { name: 'Analytics', icon: MdOutlineFindInPage, path: '/train', permission: 'predict' },
  { name: 'Automate', icon: TbReportSearch, path: '/explore', permission: 'reports' },
  { name: 'Multi Agent', icon: FaBrain, path: '/multi-agent', permission: 'reports' },
  { name: 'Reports', icon: TbReportSearch, path: '/reports', id: 6, permission: 'reports' },
  { name: 'Settings', icon: IoSettingsOutline, path: '/settings', permission: 'home' },
];

const RESTRICTED_FILE_TYPES = new Set(['image', 'pdf', 'word', 'doc', 'docx', 'xml', 'audio', 'url', 'video']);
const RESTRICTED_VIEWS = ['multi-model', 'multi-agent'];
const RESTRICTED_VIEW_HIDDEN_ITEMS = new Set(['Discover', 'Insights', 'Analytics', 'Automate', 'Reports']);
const FILE_TYPE_ALLOWED_ITEMS = new Set(['Connect', 'Workspace', 'Automate']);

export default function Sidebar() {
  const location = useLocation();

  // State for expanded menus (keeping original ID logic)
  const [expandedMenus, setExpandedMenus] = useState({
    2: false, // Workspace
    3: false, // Gen AI (previously)
    5: false  // unused?
  });

  const hasPermission = (feature) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.roles) return false;
      const allPermissions = new Set(userData.roles.flatMap(role => role.permissions || []));
      return allPermissions.has(`${feature}_read`) || allPermissions.has(`${feature}_write`) ||
        [...allPermissions].some(p => p.startsWith(`${feature}_`));
    } catch (e) {
      return false;
    }
  };

  const menuItems = useMemo(() => {
    // 1. Filter by permissions
    const permissionFiltered = MENU_ITEMS.map(item => {
      if (item.children) {
        const visibleChildren = item.children.filter(child => hasPermission(child.permission));
        if (visibleChildren.length === 0) return null;
        return { ...item, children: visibleChildren };
      }
      return hasPermission(item.permission) ? item : null;
    }).filter(Boolean);

    // 2. Filter by Context (File Type / View Type)
    let finalItems = permissionFiltered;
    let selectedType = '';
    try {
      selectedType = String(localStorage.getItem('selectedFileType') || '').toLowerCase();
    } catch (e) { }

    if (RESTRICTED_FILE_TYPES.has(selectedType)) {
      finalItems = finalItems.filter(item => FILE_TYPE_ALLOWED_ITEMS.has(item.name));
    } 

    return finalItems;
  }, [location.pathname]); // Re-evaluate when location changes (or if localstorage changes which usually triggers re-render if managed correctly, but sticking to existing logic pattern)

  const toggleExpand = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (item) => {
    if (item.name === "Analytics" && ["/train", "/predict", "/forecast"].some(p => location.pathname.startsWith(p))) {
      return true;
    }
    return location.pathname === item.path;
  };

  return (
    <div className="akkioSidebar akkioSidebarLayout akkioSidebarLayout--main shadow">
      <div className="akkioSidebar__header">
        {/* Placeholder for optional branding or title if needed later */}
      </div>
      <hr className="akkioSidebar__divider" />

      <ul className="akkioSidebar__list" id="menu">
        {menuItems.map((item) => {
          const isExpanded = expandedMenus[item.id];
          const hasChildren = item.children && item.children.length > 0;
          const ExpandIcon = isExpanded ? FaAngleDown : FaAngleRight;

          return (
            <div key={item.name}>
              <li
                className={`akkioSidebar__item ${isActive(item) ? "akkioSidebar__item--active" : ""}`}
                onClick={() => hasChildren ? toggleExpand(item.id) : null}
              >
                <Link
                  to={hasChildren ? "#" : item.path}
                  className="akkioSidebar__link"
                  onClick={(e) => hasChildren && e.preventDefault()}
                >
                  <item.icon size={20} className="akkioSidebar__icon" />
                  <span className="akkioSidebar__text">{item.name}</span>
                </Link>
                {hasChildren && <ExpandIcon size={16} className="akkioSidebar__chev" />}
              </li>

              {hasChildren && isExpanded && (
                <ul className="akkioSidebar__sublist">
                  {item.children.map((child) => (
                    <li
                      key={child.name}
                      className={`akkioSidebar__item akkioSidebar__item--sub ${location.pathname === child.path ? "akkioSidebar__item--active" : ""}`}
                    >
                      <Link to={child.path} className="akkioSidebar__link">
                        <child.icon size={18} className="akkioSidebar__icon" />
                        <span className="akkioSidebar__text">{child.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
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
