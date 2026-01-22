import React, { useEffect, useState } from "react";
// import "./styles.scss";
// import userprofile from '../../assets/images/userprofile.png'
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/images/Logo.jpeg'
import { useLocation } from "react-router-dom";
import { useDataAPI } from "../../pages/BusinessIntelligence/components/contexts/GetDataApi";
function Navbar() {
  const navigate = useNavigate()
  const [name, setName] = useState("Dashboard")
  const { handleLogout2, displayContent } = useDataAPI()
  const handleLogout = () => {
    localStorage.clear()
    handleLogout2()
    navigate('/login')
  }
  let location = useLocation();
  const formatname = (name) => {
    const nameWithoutExtension = name.split('.')[0];  // Remove the extension
    const words = nameWithoutExtension.split('_');  // Split by underscore
    return words[0]?.charAt(0)?.toUpperCase() + words[0]?.slice(1) + ' '
  };
  useEffect(() => {
    if (location.pathname === '/productivity') {
      setName("Productivity")
    } else if (location.pathname === '/gen-ai2') {
      setName("Generative AI")
    } else if (location.pathname === '/reports' || location.pathname === '/review-report') {
      setName("Reports")
    }
    else if (location.pathname === '/projects') {
      setName("Workspace")
    }
    else if (location.pathname === '/process') {
      setName("Business KPI")
    }
    else {
      setName(displayContent?.filename ? formatname(displayContent?.filename || '') : '')
    }
  }, [location.pathname, displayContent?.filename])

  const fileName = displayContent?.filename || localStorage.getItem("filename") || ""
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top bg-white-fixed" style={{ zIndex: 10, marginLeft: '0px' }}>
        <div className="collapse navbar-collapse" style={{ marginLeft: '0px' }} id="navbarNav">
          <img
            src={Logo}
            style={{ width: '100px',height:'60px',marginLeft:'50px' }}
            id="logo_RL"
            alt="Akkio"
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
            marginLeft: name === "KProcess" ? '30%' : '80px',
            marginTop: '10px',
            fontWeight: 700,
            fontSize: '23px'
          }}>
            {name}
          </div>

        </div>
        {!!fileName && (
          <div className="me-2 d-flex align-items-center">
            <span
              className="d-inline-flex align-items-center"
              title={fileName}
              style={{
                fontFamily: "poppins",
                fontSize: "12px",
                fontWeight: 500,
                color: "#212529",
                background: "#f8f9fa",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "999px",
                padding: "6px 10px",
                maxWidth: "340px",
                boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
              }}
            >
              <i className="bi bi-file-earmark-text me-2" style={{ fontSize: "14px", color: "#6c757d" }} />
              <span
                style={{
                  maxWidth: "290px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </span>
            </span>
          </div>
        )}
        <div className="nav-item ms-1 dropdown d-flex align-items-center mr-0 pr-0" style={{ color: 'black' }}>
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
            <i className="bi bi-caret-down-fill"></i>
          </a>
          <div className="dropdown-menu" aria-labelledby="navbarDropdown" style={{ position: "absolute", left: "-60px", top: "30px" }}>
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
            <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => handleLogout()}>Logout</span>
          </div>
        </div>
      </nav>
    </>

  );

}
export default Navbar;
