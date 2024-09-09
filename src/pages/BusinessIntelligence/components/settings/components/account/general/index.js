import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import styles from '../../team/general/general.module.scss'
export const GeneralAccount = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'General' }} />
                <CommonCardHeader {...{
                    header: 'Profile Details',
                    button: <button className="btn btn-primary">Save Changes</button>,
                    Children: <div>
                        <div style={{display:'flex',gap:'20px'}}>
                            <div style={{width:'100%'}}>
                                <h2 style={{ font: '500 16px/20px "Inter", sans-serif' }}>First Name</h2>
                                <input className={styles.inputClassName} />
                            </div >
                            <div style={{width:'100%'}}>
                                <h2 style={{ font: '500 16px/20px "Inter", sans-serif' }}>Last Name</h2>
                                <input className={styles.inputClassName} />
                            </div>
                        </div>
                       <p style={{marginTop:'10px',fontSize:'14px'}}>
                       Created on March 11, 2024
                       </p>
                    </div>
                }} />
                <CommonCardHeader {...{
                    header: 'Email',
                    Children: <div>
                        <h2 style={{ font: '400 16px/20px "Inter", sans-serif' }}>
                            testuser@gmail.com
                        </h2>
                        <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                            Your account is authenticated through Google.
                        </h2>
                    </div>
                }} />
                <CommonCardHeader {...{
                    header: 'Delete Account',
                    button: <button className="btn btn-danger">Delete Account</button>,
                    Children: <div>
                        <h2 style={{ font: '400 16px/20px "Inter", sans-serif' }}>Deleting your account is permanent, and all of your teams, projects, and datasets will be deleted.

                        </h2>
                    </div>
                }} />
            </div>
        </div>
    )
}