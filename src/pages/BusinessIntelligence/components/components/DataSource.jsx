import '../styles/datasource.scss'
import tableSvg from '../../../../assets/svg/table.svg'
import googleSheet from '../../../../assets/svg/googlesheet.svg'
import { useNavigate } from 'react-router-dom'
import { SiMysql } from "react-icons/si";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiMongodb } from "react-icons/si";
import { SiMqtt } from "react-icons/si";

export const DataSource = () => {
    const navigate=useNavigate()
    return <>
        <div className="mt-1">
            <h2 className='headerText'>  Pick a data source to start
            </h2>
            <div className='mainConatiner'>
                <div className='outerContainer' onClick={()=>navigate('/projects',{state:{datasource:'csv'}})}>
                    <div className='cardContainer' style={{ display: 'flex' }}>
                        <div className="stepContainer">
                            <img style={{ width: 24, height: 24, marginTop: '2px' }} src={tableSvg} class="step-tile-icon" />
                            <div data-v-fa6956f7="" class="step-tile-text-container">
                                <div data-v-fa6956f7="" class="textHeader"> Table</div>
                                <div data-v-fa6956f7="" class="textDesc"> Upload and configure datasets </div>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> CSV</span>
                            <span className='footerText'> EXCEL</span>
                            <span className='footerText'> JSON</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' >
                        <div className="stepCommonContainer">
                            <img style={{ width: 30, height: 30, marginTop: '2px' }} src={googleSheet} class="step-tile-icon" />
                            <span class="textHeader">Google Sheets</span>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' >
                        <div className="stepCommonContainer">
                            <SiMysql size={50} />
                            <div>
                            <span class="textHeader">MySQL</span>
                            <span data-v-fa6956f7="" class="textDesc"> Import Only(Beta) </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' >
                        <div className="stepCommonContainer">
                            <SiMongodb size={40}/>
                            <div>
                            <span class="textHeader">MongoDB</span>
                            <span data-v-fa6956f7="" class="textDesc"> Import Only(Beta) </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' onClick={()=>navigate('/projects',{state:{datasource:'postgresql'}})}>
                        <div className="stepCommonContainer">
                            <BiLogoPostgresql size={40}/>
                            <div>
                            <span class="textHeader">PostgreSQL</span>
                            <span data-v-fa6956f7="" class="textDesc"> Import Only(Beta) </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
                <div className='outerContainer'>
                    <div className='cardContainer' onClick={()=>{}}>
                        <div className="stepCommonContainer">
                            <SiMqtt size={40}/>
                            <div>
                            <span class="textHeader">Mqtt</span>
                            <span data-v-fa6956f7="" class="textDesc"> Import Only(Beta) </span>
                            </div>
                        </div>
                        <div className='footerContainer'>
                            <span className='footerText'> Not Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}