import { Modal } from "antd"
import Select from 'react-select';
import { customStyles } from '../../../../utils'
import { useState } from 'react'
export const AddChartPopup = ({ showModal, setShowModal, type, setType,handleSave=()=>{} }) => {
    const datasources = [
        { value: '0', label: 'Industry By Company Size' },
        { value: '1', label: 'Industry By Positive Lead Count' }
    ]

    const handleChangeDS = (e) => {
        setType(e.value)
    }
    return <>
        <Modal
            title=""
            open={showModal}
            style={{ top: '40%', zIndex: 999 }}
            onCancel={() => setShowModal(false)}
            header={[<h2>Add Chart</h2>]}
            footer={[
                <></>
            ]}
        >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start' }} >
                    <p style={{ fontSize: '20px', fontWeight: '500' }}>Select a chart.</p>
                    <p style={{ fontSize: '14px', fontWeight: '400' }}>Choose a chart to add to your dashboard</p>
                    <Select
                        styles={{
                            ...customStyles, container: provided => ({
                                ...provided,
                                minWidth: 200,
                                maxWidth: 250,
                                // zIndex: 9999999999,
                                // Ensure the dropdown is rendered above other elements
                            }),
                        }}
                        onChange={handleChangeDS}
                        options={datasources}
                    />
                    <button
                        key="link"
                        href="https://google.com"
                        type="primary"
                        loading={false}
                        onClick={() => {handleSave();setShowModal(false)}}
                        className='btn btn-primary mt-3'
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50%' }}
                    >
                        Add Chart
                    </button>,
                </div>
            </div>
        </Modal>
    </>

}