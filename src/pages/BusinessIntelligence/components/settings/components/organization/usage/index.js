import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
import './usage.css'
export const Usage = () => {
    const headers = ['Team', 'Predictions']
    const data = [
        "Testing Team", "5"
    ]
    return (
        <div style={{ padding: '50px' }}>
            <div>
                <Header {...{ userName: 'Test User', header: 'Usage' }} />
                <CommonCardHeader {...{
                    header: 'Team Usage',
                    Children: <div style={{}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{}}>
                                <h2 style={{ font: '500 20px/20px "Inter", sans-serif' }}>Period</h2>
                                <h1 style={{ font: '400 14px/20px "Inter", sans-serif', marginRight: '10px' }}>Feb 5 - Mar 5</h1>
                            </div>
                            <div style={{}}>
                                <h2 style={{ font: '500 20px/20px "Inter", sans-serif' }}>Predictions</h2>
                                <h1 style={{ font: '400 14px/20px "Inter", sans-serif', marginRight: '10px' }}>5/10,00,000</h1>
                            </div>
                        </div>

                        <div class="slidecontainer">
                            <p>Default range slider:</p>
                            <input type="range" min="1" max="100" value="10" />
                        </div>

                        <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                            The prediction usage of all teams within the organization adds up here.
                        </h2>
                        <div style={{ display: 'flex', borderBottom: '1px solid lightgrey', marginTop: '30px' }}>{headers.map((item) => {
                            return <p style={{ width: '40%', fontSize: "16px", fontWeight: 500 }}>{item}</p>
                        })}</div>
                        <div style={{ display: 'flex', marginTop: '10px' }}>{data.map((item) => {
                            return <p style={{ width: '40%' }}>{item}</p>
                        })}</div>

                    </div>
                }} />
            </div>
        </div>
    )
}