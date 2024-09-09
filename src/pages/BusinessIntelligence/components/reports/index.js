import { FaPlus } from "react-icons/fa6";
import {useState} from 'react'
import { UpgradePopup } from "../components/popups/upgradePopup";
import { useNavigate } from "react-router-dom";
export const ReportsGenBI = () =>{
    const [show,setShow] = useState(false)
    const navigate=useNavigate()
    return(
        <div style={{display:'flex',gap:'10px',padding:'10px'}}>
          <button className="btn btn-primary" onClick={()=>setShow(true)}><FaPlus /> Create New Chart</button>
          <button className="btn btn-primary" onClick={()=>navigate('/gen-dashboard')}><FaPlus />Add to dashboard</button>
          <UpgradePopup {...{ showModal: show, setShowModal: setShow }} />
        </div>
    )
}