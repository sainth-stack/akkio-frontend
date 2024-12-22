// src/pages/kpi/index.js
import { useState } from 'react';
import DefaultKPIs from './default/index';
import CustomizedKPIs from './customized/index';
import './index.css';

const KPI = () => {
    const [selectedSection, setSelectedSection] = useState(null);

    const handleCardClick = (section) => {
        setSelectedSection(section);
    };

    const handleBack = () => {
        setSelectedSection(null);
    };

    if (selectedSection) {
        return (
            <div className="" style={{ padding: '2rem' }}>
                <button className="backButton" onClick={handleBack}>
                    ← Back
                </button>
                <div className="">
                    {selectedSection === 'default' ? <DefaultKPIs /> : <CustomizedKPIs />}
                </div>
            </div>
        );
    }

    return (
        <div className="container1">
            <div className="sections">
                <section
                    className="section clickable"
                    onClick={() => handleCardClick('default')}
                >
                    <h2>Default KPIs</h2>
                    <div>
                        <p>This is the Default KPIs section. Here you can find standard KPI metrics.</p>
                    </div>
                </section>

                <section
                    className="section clickable"
                    onClick={() => handleCardClick('customized')}
                >
                    <h2>Customized KPIs</h2>
                    <p>This is the Customized KPIs section. Here you can create and manage your custom KPI metrics.</p>
                </section>
            </div>
        </div>
    );
}

export default KPI;