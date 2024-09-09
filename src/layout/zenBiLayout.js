import React from "react";
import Navbar from "../components/Navbar";
import SidebarV2 from "../components/SidebarV2";
import './style.css'
import { Outlet, Navigate, useNavigate } from "react-router-dom"
import GenBiSidebar from "../components/Sidebar/zenbiSidebar";
export function ZenBiLayout(props) {
  const isAuthenticated = () => {
    const accessToken = localStorage.getItem("token")
    return true
  }
  return (
    <div className="row p-0 m-0">
      <React.Fragment>
      { isAuthenticated() ? <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 p-0 m-0 bg-light">
          <div className="d-flex justify-content-between" >
            <div className={""}>
              <GenBiSidebar />
            </div>
            <div className="p-0 w-100 main-content new-sidebar">
            <Outlet />
            </div>
          </div>
        </div> : (
          <Navigate to="/login" replace />
        )}
      </React.Fragment>
    </div>
  );
}
