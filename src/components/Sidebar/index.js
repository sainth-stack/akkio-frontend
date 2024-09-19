/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "./styles.css";
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

export default function Sidebar() {
  const location = useLocation()
  const [expand, setExpand] = useState({
    expand1: false,
    expand2: false,
    expand3: false
  })
  const finData = [
    { name: 'Home', icon: IoHome, path: '/welcome', id: 1 },
    { name: 'Projects', icon: GoProjectRoadmap, path: '/projects', id: 2 },
    {
      name: 'Gen BI', icon: GiArtificialIntelligence, id: 3, children: [
        { name: 'Connect', icon: BiSolidData, path: '/connect', },
        { name: 'Discover', icon: BiSolidAnalyse, path: '/discover', },
        { name: 'Forecast', icon: MdOutlineFindInPage, path: '/forecast' },
        { name: 'Predict', icon: MdOutlineFindInPage, path: '/deployment' },
        { name: 'Reports', icon: TbReportSearch, path: '/reports' },
      ]
    },
    {
      name: 'Gen AI', icon: GiArtificialIntelligence, id: 3.2,path:'/gen-ai'
    },
    { name: 'Dashboard', icon: MdDashboard, path: '/gen-dashboard', id: 4 },
    { name: 'Settings', icon: IoSettingsOutline, path: '/settings/team/general', id: 5 },
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
      <div class="shadow sidebar-scroll sticky-top mt-2" style={{ overflow: 'auto', width: '220px', position: "fixed", left: 0, top: 60, background: '#000', zIndex: 10, height: '92vh' }}>
        {/* <div style={{ padding: '8px', paddingTop: '24px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <IoLocationSharp size={30} style={{ color: 'white' }} />
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>Digital Twin</h2>
            <h2 style={{ fontSize: '12px', fontWeight: 400, color: 'white' }}>U.S</h2>
          </div>
        </div> */}
        <hr style={{ border: '1px solid white', padding: 0, margin: 0, marginTop: '0px' }} />
        <ul class="sidebar-list-items pt-2" id="menu">
          {data.map((item) => {
            let NewIcon = (item.id === 2 && expand.expand1) || (item.id === 3 && expand.expand2) || (item.id === 5 && expand.expand3) ? FaAngleDown : FaAngleRight
            return (
              <div>
                <li class={`sidebar-list-item cursor-pointer p-2 mt-1 ${location.pathname === item.path ? 'backgroundSelected' : ''}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Link to={item?.children?.length > 0 ? '#' : item.path} onClick={() => item?.children?.length > 0 ? () => { } : handleClickExpand(item.id)} class="nav-link align-middle px-2 nav-item" >
                    <div>
                      <item.icon size={20} style={{ color: location.pathname === item.path ? 'black' : 'white' }} />
                      <span class="ms-1 d-none d-sm-inline link-text px-1" style={{ color: location.pathname === item.path ? 'black' : 'white' }}>{item.name}</span>
                    </div>
                  </Link>
                  {item?.children?.length > 0 && <NewIcon size={20} style={{ color: 'white', cursor: 'pointer' }} onClick={() => handleClickExpand(item.id)} />}
                </li>
                {
                  ((item.id === 2 && expand.expand1) || (item.id === 3 && expand.expand2) || (item.id === 5 && expand.expand3)) && <>
                    <ul class="sidebar-list-items ps-4" id="menu">
                      {item?.children?.map((item) => {
                        return (
                          <li class={`sidebar-list-item cursor-pointer p-2 mt-1 ${location.pathname === item.path ? 'backgroundSelected' : ''}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Link to={item.path} class="nav-link align-middle px-2 nav-item" >
                              <div>
                                <item.icon size={20} style={{ color: location.pathname === item.path ? 'black' : 'white' }} />
                                <span class="ms-1 d-none d-sm-inline link-text px-1" style={{ color: location.pathname === item.path ? 'black' : 'white' }}>{item.name}</span>
                              </div>
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
      </div >
    </>
  );
}
