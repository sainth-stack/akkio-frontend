// MiddleContent.js

import React from 'react';
import { Link } from "react-router-dom";
import styles from './middle.module.scss';
const MiddleContent = () => {
    return (
        <div className=' p-0 m-0'>
            <div className='row'>
                <div className={`${styles.middleContent} col-6`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '92vh', justifyContent: 'center' }}>
                    <h1>Welcome to Otamat Platform                    </h1>
                    <p style={{ width: '90%' }}>
                        Decision-based Self-Service  data-driven GenBI-GenAI Platform" combines elements of decision support, self-service accessibility, advanced analytics, data-driven insights, and Generative Artificial intelligence to empower users to make informed decisions and optimize processes across various domains.
                    </p>
                    <Link to={'/connect'} class="nav-link align-middle px-2 nav-item">
                        <button className={styles.ctaButton} >Get Started</button>
                    </Link>
                </div>
                <div className={`${styles.rightContent} col-6`}>

                </div>
            </div>
        </div>
    );
};

export default MiddleContent;