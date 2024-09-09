import { useLocation } from "react-router-dom";
// import { ProductivityThroughput } from "../InnerProductivity/InnerProductivity/productivity-throughput";
import ReactToPrint from 'react-to-print';
import { useRef } from "react"
import { getData } from '../../utils'

export const HtmlReport = () => {
    const { state } = useLocation();
    const componentRef = useRef();

    return (
        <div className="container printonly" ref={componentRef}>
            <div className="d-flex justify-content-between">
                <h1 className="head-1 mt-3 mb-3 ms-2" style={{ fontSize: '28px', fontWeight: 800, fontFamily: "Poppins" }}>Opex Report</h1>
                <ReactToPrint
                    trigger={() => <div className="p-3 pe-0">
                        <button
                            className="btn btn-primary"
                            lineHeight={'24px'}
                            height={'44px'}
                            // startIcon={<image src={upload} />}
                            children={'Print'}
                        />{' '}
                    </div>}
                    content={() => componentRef.current}
                />
            </div>
            <div className="mb-5 review-report" style={{ backgroundColor: "white", padding: '24px' }}>
                <div className="container mt-3">
                    <h5 className="page-header">Benefits</h5>
                    <p className="desc-ben">2% reduction of MoM OpEx has resulted in direct cost savings of $ 11, 345
                    </p>
                </div>
                <div className="container mt-3 monthlydata">
                    <h5 className="page-header">Monthly Data</h5>
                    {/* <ProductivityThroughput selData={state?.data?.data} report={true} /> */}
                </div>
                <div className="container mt-3">
                    <h5 className="page-header">Inferences</h5>
                    <ul style={{ listStyle: "none" }} className='p-0 m-0 ps-3'>
                        {
                            state?.data?.inference.map((item) => {
                                return <li className='m-0 p-0' style={{ fontFamily: "poppins", fontWeight: 400, fontSize: '16px' }}>- {item}</li>
                            })
                        }
                    </ul>
                    <h5 className="page-header">Recomondations</h5>
                    {state?.data?.recommondations?.length > 0 ? <ul style={{ listStyle: "none" }} className='p-0 m-0 ps-3'>
                        {
                            state?.data?.recommondations.map((item) => {
                                return <li className='m-0 p-0' style={{ fontFamily: "poppins", fontWeight: 400, fontSize: '16px' }}>- {item}</li>
                            })
                        }
                    </ul> :<li className='m-0 p-0 ps-3' style={{ fontFamily: "poppins", fontWeight: 400, fontSize: '16px',listStyle: "none" }}>- No Recomondations</li>}
                    <h5 className="page-header">Predictions</h5>
                    <ul style={{ listStyle: "none" }} className='p-0 m-0 ps-3'>
                        {
                            state?.data?.predictions.map((item) => {
                                return <li className='m-0 p-0' style={{ fontFamily: "poppins", fontWeight: 400, fontSize: '16px' }}>- {item}</li>
                            })
                        }
                    </ul>
                </div>
            </div>
        </div >
    )
}