import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import { Labeling } from "../../organization/white-labeling"
import styles from './general.module.scss'
export const GeneralTeam = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'General' }} />
                <CommonCardHeader {...{
                    header: 'General',
                    button: <button className="btn btn-primary">Save Changes</button>,
                    Children: <div>
                        <h2 style={{ font: '500 16px/20px "Inter", sans-serif' }}>Team Name</h2>
                        <input className={styles.inputClassName} />
                    </div>
                }} />
                <Labeling />
                <CommonCardHeader {...{
                    header: 'Delete Team',
                    button: <button className="btn btn-danger">Delete Team</button>,
                    Children: <div>
                        <h2 style={{ font: '400 16px/20px "Inter", sans-serif' }}>Deleting this team will permanently erase all related projects and data. This action is irreversible.
                        </h2>
                    </div>
                }} />
            </div>
        </div>
    )
}