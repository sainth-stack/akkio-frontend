/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "../Sidebar/akkioSidebar.scss";
import "../Sidebar/akkioSidebarLayout.scss";
import { IoHomeOutline, IoPeople } from 'react-icons/io5'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { FaCode } from "react-icons/fa6";
import { GoOrganization } from "react-icons/go";
import { FaRegBuilding } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";


import { Link, useNavigate, useLocation } from "react-router-dom";
import WorkspaceUsageCard from "../Sidebar/WorkspaceUsageCard";
export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = [
    {
      name: 'Team',
      children: [{ name: 'General', icon: IoHomeOutline, path: '/settings/team/general' },
      { name: 'Members', icon: IoPeople, path: '/settings/team/members' },
      { name: 'API keys', icon: FaCode, path: '/settings/team/api-keys' }]
    },
    {
      name: 'Organization',
      children: [{ name: 'General', icon: GoOrganization, path: '/settings/organization/general' },
      { name: 'Members', icon: IoPeople, path: '/settings/organization/members' },
      // { name: 'Usage',icon:FiPieChart,path:'settings/organization/usage' },
      { name: 'Billing', icon: FaRegBuilding, path: '/settings/organization/billing' },
      { name: 'White Labeling', icon: FaChartLine, path: '/settings/organization/whitelabeling' }]
    },
    {
      name: 'Account',
      children: [{ name: 'General', icon: IoPeople, path: '/settings/account/general' },
      // { name: 'Notification',icon:BsBell,path:'/settings/account/notification' },
      { name: 'Legal', icon: IoDocument, path: '/settings/account/legal' }]
    },
  ]
  return (
    <>
      <div className="shadow sticky-top mt-3 akkioSidebar akkioSidebarLayout akkioSidebarLayout--settings">
        <button className="btn btn-primary m-3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }} onClick={() => navigate('/welcome')}><IoMdArrowRoundBack />Back</button>
        <hr className="akkioSidebar__divider" style={{ marginTop: '3px' }} />
        {data.map((item) => {
          return (
            <ul className="akkioSidebar__list" id="menu" style={{paddingLeft: '20px' }}>
              <p className="akkioSidebar__sectionTitle" style={{ padding: '5px' }}>{item.name}</p>
              {item.children.map((item) => {
                return (
                  <li className={`akkioSidebar__item cursor-pointer p-2 mt-2 ${location.pathname === item.path ? 'akkioSidebar__item--active' : ''}`}>
                    <Link to={item.path} className="akkioSidebar__link">
                      <item.icon size={20} className="akkioSidebar__icon" style={{ marginBottom: '5px' }} />
                      <span className="akkioSidebar__text">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )
        })}
        <WorkspaceUsageCard />
      </div>
    </>
  );
}
