import UploadData from './components/components/UploadData'
import {useLocation} from 'react-router-dom';

export const BusinessIntelligence = () => {
    const location = useLocation();
    return (
        <div>
           <UploadData datasource={location?.state?.datasource || 'csv'}/> 
        </div>
    )
}