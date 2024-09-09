import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Navbar = () => {
  const location = useLocation()
  return (
    // <div className="nav-container ms-1">
    //   <nav className="navbar navbar-expand-lg navbar-light bg-white">
    //     <div className="container-fluid">
    //       <div>
    //         <Link to={location.pathname == '/predict' ? '/prepare':"/business-intelligence"} style={{ textDecoration: "none" }}>
    //           {location.pathname !== '/' ? <button type='button' className="navbar-brand btn btn-primary text-white"> Go Back</button> : <img src={'/keyPulse.png'} alt='Key Pulse' width={185} height={82} />}
    //         </Link>
    //         <Link to={"/prepare"} style={{ textDecoration: "none" }}>
    //           {<button type='button' className="navbar-brand btn btn-primary text-white"> Connect</button>}
    //         </Link>
    //         <Link to={"/predict"} style={{ textDecoration: "none" }}>
    //           {<button type='button' className="navbar-brand btn btn-primary text-white"> Predict</button>}
    //         </Link>
    //         <Link to={"/deployment"} style={{ textDecoration: "none" }}>
    //           {<button type='button' className="navbar-brand btn btn-primary text-white"> Deploy</button>}
    //         </Link>
    //         <Link to={"/settings/team/general"} style={{ textDecoration: "none" }}>
    //           {<button type='button' className="navbar-brand btn btn-primary text-white"> Settings</button>}
    //         </Link>

    //       </div>
    //     </div>
    //   </nav>
    // </div>
    <></>
  )
}

export default Navbar