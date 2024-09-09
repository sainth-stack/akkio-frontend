import { useNavigate } from "react-router-dom"
import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
export const Legal = () => {
    const navigate = useNavigate()
    return (
        <div style={{ padding: '50px' }}>
        <div>
            <Header {...{ userName: 'Test User', header: 'Legal' }} />
            <CommonCardHeader {...{
                header: 'Documents',
                Children: <div>
                    <h2 onClick={()=>navigate('/terms')} style={{ font: '500 16px/20px "Inter", sans-serif',textDecoration:'underline',color:'blue',cursor:'pointer' }}>Terms Of Services</h2>
                    <h2 onClick={()=>navigate('/legal')} style={{ font: '500 16px/20px "Inter", sans-serif',textDecoration:'underline',color:'blue',marginTop:'10px',cursor:'pointer' }}>Privacy Policy</h2>
                </div>
            }} />
        </div>
    </div>
    )
}