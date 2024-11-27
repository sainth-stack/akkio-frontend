/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
// import "./styles.scss";
// import userprofile from '../../assets/images/userprofile.png'
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/images/Logo2.jpg'
import { AiTwotoneCalendar } from 'react-icons/ai'
import { useLocation } from "react-router-dom";
import { useDataAPI } from "../../pages/BusinessIntelligence/components/contexts/GetDataApi";
function Navbar() {
  const navigate = useNavigate()
  const [name, setName] = useState("Dashboard")
  const { handleLogout2, displayContent } = useDataAPI()
  console.log(displayContent)
  const handleLogout = () => {
    localStorage.clear()
    handleLogout2()
    navigate('/login')
  }
  let location = useLocation();
  const formatname = (name) => {
    console.log(name)
    const nameWithoutExtension = name.split('.')[0];  // Remove the extension
    const words = nameWithoutExtension.split('_');  // Split by underscore
    return words[0]?.charAt(0)?.toUpperCase() + words[0]?.slice(1) + ' '
  };
  useEffect(() => {
    if (location.pathname == '/productivity') {
      setName("Productivity")
    } else if (location.pathname === '/gen-ai2') {
      setName("Generative AI")
    } else if (location.pathname == '/reports' || location.pathname == '/review-report') {
      setName("Reports")
    }
    else if (location.pathname == '/projects') {
      setName("Projects")
    }
    else if (location.pathname == '/process') {
      setName("Business KPI")
    }
    else {
      setName(displayContent?.filename ? formatname(displayContent?.filename || '') : '')
    }
  }, [location.pathname])


  return (
    <>
      <nav class="navbar navbar-expand-lg  navbar-light bg-white shadow-sm sticky-top bg-white-fixed" style={{ zIndex: 10, marginLeft: '0px' }}>
        <div class="collapse navbar-collapse" style={{ marginLeft: '0px' }} id="navbarNav">
          <img
            src={Logo}
            style={{ width: '160px' }}
            id="logo_RL"
          />
          {/* {name == "KProcess" && <div style={{
            marginLeft: '80px',
            marginTop: '10px',
            fontWeight: 700,
            fontSize: '23px',
            color:"#427ae3"
          }}>
            Dashboard
          </div>} */}
          <div style={{
            marginLeft: name == "KProcess" ? '30%' : '80px',
            marginTop: '10px',
            fontWeight: 700,
            fontSize: '23px'
          }}>
            {name}
          </div>

        </div>
        {/* <div className="card me-2" style={{
          fontFamily: "poppins", fontSize: "12px", alignItems: "center",
          display: 'flex',
          padding: "4px"
        }}>
          <span>  Jan - Dec 2023    <AiTwotoneCalendar style={{ marginTop: "-3px" }} /></span>
        </div> */}
        <div class="nav-item ms-1 dropdown d-flex align-items-center mr-0 pr-0" style={{ color: 'black' }}>
          <a
            className="nav-link dropdown-toggle p-0 m-0 pe-5"
            href="/#"
            id="navbarDropdown"
            role="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            style={{ textDecoration: 'none', color: 'black' }}
          >
            <span className="ml-2 fs14 text-dark" title={"Admin"}>
              {JSON.parse(localStorage.getItem("user"))?.name || "admin"}
            </span>
            <i class="bi bi-caret-down-fill"></i>
          </a>
          <div class="dropdown-menu" aria-labelledby="navbarDropdown" style={{ position: "absolute", left: "-60px", top: "30px" }}>
            <div className="dropdown-item user-info" style={{
              padding: "10px 15px",
              borderBottom: "1px solid #eee"
            }}>
              <div style={{ fontWeight: "500" }}>
                {JSON.parse(localStorage.getItem("user"))?.name || "Admin"}
              </div>
              {/* <div style={{ fontSize: "0.9em", color: "#666" }}>
                {JSON.parse(localStorage.getItem("user"))?.email || "admin@example.com"}
              </div>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                {JSON.parse(localStorage.getItem("user"))?.organization?.name || "Organization"}
              </div> */}
            </div>
            <span class="dropdown-item " style={{ cursor: 'pointer' }} onClick={() => handleLogout()}>Logout</span>
          </div>
        </div>
      </nav>
    </>

  );

}
export default Navbar;
