import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import styles from './general.module.scss'
export const GeneralOrganization = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'General' }} />
                <CommonCardHeader {...{
                    header: 'Organization details',
                    button: <button className="btn btn-primary">Save Changes</button>,
                    Children: <div>
                        <h2 style={{ font: '500 16px/20px "Inter", sans-serif' }}>Organization Name</h2>
                        <input className={styles.inputClassName} />
                    </div>
                }} />
            </div>
        </div>
    )
}