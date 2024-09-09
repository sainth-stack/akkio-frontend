import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"

export const ApiKeys = () => {
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'Api Keys' }} />
                <CommonCardHeader {...{
                    header: 'API Keys',
                    Children: <div style={{font:'400 14px/20px "Inter", sans-serif'}}>
                        474b0e43-037e-4b40-aef5-28978adeb9bf
                    </div>
                }} />
            </div>
        </div>
    )
}