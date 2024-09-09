/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import "./styles.css";
import { IoHomeOutline, IoPeople } from 'react-icons/io5'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { FaCode } from "react-icons/fa6";
import { BiSolidData } from "react-icons/bi";
import { BiSolidAnalyse } from "react-icons/bi";
import { MdOutlineFindInPage } from "react-icons/md";
import { MdPublishedWithChanges } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { IoSettingsOutline } from "react-icons/io5";
import { useState } from 'react'
import { Link, useNavigate,useLocation } from "react-router-dom";
import { BsClipboardData } from "react-icons/bs";
import { UpgradePopup } from "../../pages/BusinessIntelligence/components/components/popups/upgradePopup";
export default function GenBiSidebar() {
    const navigate = useNavigate()
    const [show, setShow] = useState(false);
    const data3 = localStorage.getItem("filename")
    const location = useLocation()
    const handleClick = (e) => {
        if (!(['retail sales data.csv', 'Credit_Card_Frauds.csv'].includes(data3))) {
            e.stopPropagation()
            setShow(true)
        }
    }
    const data = [
        {
            name: '',
            children: [{ name: 'Connect', icon: BiSolidData, path: '/connect', },
            { name: 'Discover', icon: BiSolidAnalyse, path: '/discover', },
            { name: 'Predict', icon: MdOutlineFindInPage, path: '/predict' },
            { name: 'Publish', icon: MdPublishedWithChanges, path: '/deployment' },
            { name: 'Reports', icon: TbReportSearch, path: '/reports' },
            // { name: 'Datasets', icon: BsClipboardData, path: '/datasets' },
            ]
        },
    ]

    const handlegetpath = (item) => {
        if (['Connect', 'Discover', 'Datasets', 'Reports'].includes(item.name)) {
            return item.path
        }
        else if (['retail sales data.csv', 'Credit_Card_Frauds.csv'].includes(data3)) {
            return item.path
        } else return '#'
    }
    return (
        <>
            <div class="shadow sidebar-scroll sticky-top mt-3" style={{ overflow: 'auto', width: '220px', position: "fixed", left: 0, top: -20, background: '#fff', zIndex: 10, height: '100vh' }}>
                <button className="btn btn-primary m-3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }} onClick={() => navigate('/welcome')}><IoMdArrowRoundBack />Back</button>
                {data.map((item) => {
                    return (
                        <ul class="sidebar-list-items" id="menu" style={{ padding: '10px', paddingLeft: '20px' }}>
                            <p style={{ fontSize: '18px', fontWeight: 500 }}>{item.name}</p>
                            {item.children.map((item) => {
                                return (
                                    <li class={`sidebar-list-item cursor-pointer p-2 mt-2 ${location.pathname ===item.path ? 'backgroundSelected':''}`} onClick={(e) => ['Predict', 'Publish'].includes(item.name) ? handleClick(e) : () => { }}>
                                        <Link to={handlegetpath(item)} class="nav-link align-middle px-3 nav-item">
                                            <item.icon size={24} style={{color:location.pathname ===item.path ? 'white':'black',marginBottom: '6px'}}/>
                                            <span class="ms-1 d-none d-sm-inline link-text px-1" style={{ fontSize: '16px', fontWeight: 400,color:location.pathname ===item.path ? 'white':'black' }} >{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )
                })}
            </div>
            <UpgradePopup {...{ showModal: show, setShowModal: setShow }} />
        </>
    );
}
