import profile from '../../../../../../../assets/images/images.png'
export const Header = ({ header = 'Header', userName = "username" }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ font: '400 24px/32px "Suisse Intl", sans-serif' }}>{header}</h2>
            <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <img src={profile} alt='' style={{width:'24px',height:'24px',borderRadius:'50%'}}/>
                <h3 style={{ font: '400 18px/14px "Suisse Intl", sans-serif' ,marginTop:'5px'}}>{userName}</h3>
            </div>
        </div>
    )
}