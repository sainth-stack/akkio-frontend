

import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"

export const MembersOrganization = () => {
    const headers = ['Name', 'Email', 'Type', 'Role']
    const data = [
        "Test User", "testuser@gmail.com", <select value={"View Only"}>
            <option>View Only</option>
        </select>, <select value={"Owner"}>
            <option>Owner</option>
        </select>
    ]
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'Organization Members' }} />
                <CommonCardHeader {...{
                    header: 'Organization Members',
                    button: <button className="btn btn-primary">Invite Member</button>,
                    Children: <div style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid lightgrey' }}>{headers.map((item) => {
                            return <p style={{ width: '220px' }}>{item}</p>
                        })}</div>
                        <div style={{ display: 'flex', marginTop: '10px' }}>{data.map((item) => {
                            return <p style={{ width: '220px' }}>{item}</p>
                        })}</div>
                    </div>
                }} />
            </div>
        </div>
    )
}