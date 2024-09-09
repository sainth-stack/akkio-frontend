import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"

export const MembersTeam = () => {
    const headers = ['Name', 'Email', 'Date joined', 'Role']
    const data = [
        "Test User", "testuser@gmail.com", '28/08/2023', 'Admin'
    ]
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'Members' }} />
                <CommonCardHeader {...{
                    header: 'Members',
                    button: <button className="btn btn-primary">Invite Member</button>,
                    Children: <div style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                        <div style={{ display: 'flex',borderBottom:'1px solid lightgrey' }}>{headers.map((item) => {
                            return <p style={{ width: '220px' }}>{item}</p>
                        })}</div>
                        <div style={{ display: 'flex',marginTop:'10px' }}>{data.map((item) => {
                            return <p style={{ width: '220px' }}>{item}</p>
                        })}</div>
                    </div>
                }} />
            </div>
        </div>
    )
}