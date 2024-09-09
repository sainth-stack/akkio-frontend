import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import styles from '../../team/general/general.module.scss'
export const Labeling = () => {
    return (
        <CommonCardHeader {...{
            header: 'Customization',
            Children: <div>
                <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>Customize your branding across the Web App, Reports, and sharable Chat Explore endpoints.</h2>
                <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>The global configuration below will be applied to any teams within the organization that do not have their own configuration set up.
                </h2>
                <div className="mt-3">
                    <h2 style={{ font: '500 18px/20px "Inter", sans-serif' }}>Company Logo</h2>
                    <button className="btn btn-primary">Upload Logo</button>
                </div>
                <div className="mt-4">
                    <h2 style={{ font: '500 16px/20px "Inter", sans-serif' }}>Chat assistant name</h2>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <input className={styles.inputClassName} />
                        <button className="btn btn-primary " style={{ width: '150px' }}>Save Changes</button>
                    </div>
                    <button className="btn btn-danger mt-2">Remove Customization</button>
                </div>
            </div>
        }} />
    )
}
export const WhiteLabeling = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'White labeling' }} />
                <Labeling />
            </div>
        </div>
    )
}