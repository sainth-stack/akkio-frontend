import styles from './cardheader.module.scss'
export const CommonCardHeader = ({ header = 'Header', button, Children = <>Children</> }) => {
    return (
        <div style={{ border: '1px solid hsl(240, 17.4%, 91%)', borderRadius: '8px',marginTop:'30px'}}>
            <div className={styles.cardHeaderContainer}>
                <h2 style={{ font: '500 18px/24px "Inter", sans-serif',marginTop:'10px' }}>{header}</h2>
                {button && button}
            </div>
            <div style={{padding:'20px'}}>
                {Children}
            </div>
        </div>
    )
}