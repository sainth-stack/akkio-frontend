/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./styles.css";
import { IoHomeOutline, IoPeople } from 'react-icons/io5'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { FaCode } from "react-icons/fa6";
import { GoOrganization } from "react-icons/go";
import { FaRegBuilding } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";


import { Link, useNavigate, useLocation } from "react-router-dom";
export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  console.log(location.pathname)
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
      <div class="shadow sidebar-scroll sticky-top mt-3" style={{ overflow: 'auto', width: '220px', position: "fixed", left: 0, top: -20, background: '#000', zIndex: 10, height: '100vh' }}>
        <button className="btn btn-primary m-3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }} onClick={() => navigate('/welcome')}><IoMdArrowRoundBack />Back</button>
        <hr style={{ border: '1px solid white', padding: 0, margin: 0, marginTop: '3px' }} />
        {data.map((item) => {
          return (
            <ul class="sidebar-list-items" id="menu" style={{paddingLeft: '20px' }}>
              <p style={{ fontSize: '18px', fontWeight: 500,color:'white' ,padding:'5px'}}>{item.name}</p>
              {item.children.map((item) => {
                return (
                  <li class={`sidebar-list-item cursor-pointer p-2 mt-2 ${location.pathname === item.path ? 'backgroundSelected' : ''}`}>
                    <Link to={item.path} class="nav-link align-middle nav-item">
                      <item.icon size={20} style={{ marginBottom: '5px', color: location.pathname === item.path ? 'black' : 'white' }} />
                      <span class="ms-1 d-none d-sm-inline link-text px-1" style={{ fontSize: '14px', fontWeight: 400, color: location.pathname === item.path ? 'black' : 'white' }}>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )
        })}
      </div>
    </>
  );
}
