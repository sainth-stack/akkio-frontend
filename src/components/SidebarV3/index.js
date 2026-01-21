/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "../Sidebar/akkioSidebar.scss";
import "../Sidebar/akkioSidebarLayout.scss";
import { GiArtificialIntelligence } from 'react-icons/gi'
import { MdDashboard } from "react-icons/md";
import { Link } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { IoLocationSharp } from "react-icons/io5";
import { BiSolidData } from "react-icons/bi";
import { BiSolidAnalyse } from "react-icons/bi";
import { MdOutlineFindInPage } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { IoHome } from "react-icons/io5";
import { GoProjectRoadmap } from "react-icons/go";
import WorkspaceUsageCard from "../Sidebar/WorkspaceUsageCard";

export default function SidebarAdmin() {
  const location = useLocation()
  const [expand, setExpand] = useState({
    expand1: false,
    expand2: false,
    expand3: false
  })
  const finData = [
    { name: 'Organizations', icon: IoHome, id: 1, path: '/admin/organizations' },
    { name: 'Users', icon: GoProjectRoadmap, path: '/admin/users', id: 2 },
    { name: 'Roles', icon: BiSolidData, path: '/admin/roles', id: 5 },
    { name: 'API-KEY', icon: TbReportSearch, path: '/admin/api-key', id: 6 },
  ]
  const [data, setData] = useState(finData)

  const handleClickExpand = (id) => {
    if (id === 2) {
      setExpand({
        ...expand, expand1: !expand.expand1
      })
    } else if (id === 3) {
      setExpand({
        ...expand, expand2: !expand.expand2
      })
    } else if (id === 5) {
      setExpand({
        ...expand, expand3: !expand.expand3
      })
    }
  }
  return (
    <>
      <div className="shadow sticky-top mt-2 akkioSidebar akkioSidebarLayout akkioSidebarLayout--admin">
        {/* <div style={{ padding: '8px', paddingTop: '24px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <IoLocationSharp size={30} style={{ color: 'white' }} />
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>Digital Twin</h2>
            <h2 style={{ fontSize: '12px', fontWeight: 400, color: 'white' }}>U.S</h2>
          </div>
        </div> */}
        <hr className="akkioSidebar__divider" />
        <ul className="akkioSidebar__list pt-2" id="menu">
          {data.map((item) => {
            let NewIcon = (item.id === 2 && expand.expand1) || (item.id === 3 && expand.expand2) || (item.id === 5 && expand.expand3) ? FaAngleDown : FaAngleRight
            return (
              <div>
                <li className={`akkioSidebar__item cursor-pointer p-2 mt-1 ${location.pathname === item.path ? 'akkioSidebar__item--active' : ''}`}>
                  <Link to={item?.children?.length > 0 ? '#' : item.path} onClick={() => item?.children?.length > 0 ? () => { } : handleClickExpand(item.id)} className="akkioSidebar__link" >
                      <item.icon size={20} className="akkioSidebar__icon" />
                      <span className="akkioSidebar__text">{item.name}</span>
                  </Link>
                  {item?.children?.length > 0 && <NewIcon size={20} className="akkioSidebar__chev" onClick={() => handleClickExpand(item.id)} />}
                </li>
                {
                  ((item.id === 2 && expand.expand1) || (item.id === 3 && expand.expand2) || (item.id === 5 && expand.expand3)) && <>
                    <ul className="akkioSidebar__list ps-4" id="menu">
                      {item?.children?.map((item) => {
                        return (
                          <li className={`akkioSidebar__item cursor-pointer p-2 mt-1 ${location.pathname === item.path ? 'akkioSidebar__item--active' : ''}`}>
                            <Link to={item.path} className="akkioSidebar__link" >
                                <item.icon size={20} className="akkioSidebar__icon" />
                                <span className="akkioSidebar__text">{item.name}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                }
              </div>
            )
          })}
        </ul >
        <WorkspaceUsageCard />
      </div >
    </>
  );
}
