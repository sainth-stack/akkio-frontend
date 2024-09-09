
import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import './notification.css'
export const Notification = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'Notification' }} />
                <CommonCardHeader {...{
                    header: 'Email notifications',
                    Children: <div>
                        <h2 style={{ font: '400 16px/20px "Inter", sans-serif',display:'flex',alignItems:'center',gap:'20px' }}>
                            <label class="switch">
                                <input type="checkbox" checked={true} />
                                    <span class="slider round"></span>
                            </label>
                            Receive emails about new features and other news.
                        </h2>
                    </div>
                }} />
            </div>
        </div>
    )
}