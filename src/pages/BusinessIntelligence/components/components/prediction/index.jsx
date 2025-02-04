import { useState } from "react"
import PredictData from "./PredictData"

export const PredictionAndForecast = () => {
    const [type, setType] = useState('Forecast')
    return (
        <div>
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <input type="radio" id="html" name="fav_language" value={type} checked={type ==='Predict'} onChange={()=>setType('Predict')}/>
                    <label for="html">Predict</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <input type="radio" id="css" name="fav_language" value={type} checked={type ==='Forecast'} onChange={()=>setType('Forecast')}/>
                    <label for="css">Forecast</label>
                </div>
            </div> */}
          <PredictData />
            {/* {type==='Forecast' && <ForecastData />} */}

        </div>
    )
}