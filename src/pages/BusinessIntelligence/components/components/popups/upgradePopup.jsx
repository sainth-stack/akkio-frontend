import { Modal } from "antd"
import { BsStars } from 'react-icons/bs'
export const UpgradePopup = ({ showModal, setShowModal }) => {
    return <>

     <Modal
        title=""
        open={showModal}
        style={{ top: '40%', zIndex: 99999 }}
        onCancel={() => setShowModal(false)}
        footer={[
          <button
            key="link"
            href="https://google.com"
            type="primary"
            loading={false}
            onClick={()=>{}}
            style={{ width: '100%' }}
            className='btn btn-primary'
          >
            Upgrade Plan
          </button>,
        ]}
      >
        {/* <Input size='large' onChange={(e) => handleEvent(e)} value={prepData} type="text" placeholder="e.g. Filter out all columns except the first 2" /> */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <BsStars size={24} color='blue' style={{ marginTop: '20px', marginBottom: '10px' }} />
          <p style={{ fontSize: '18px', fontWeight: '500' }}>This feature is not available for the view only plan.</p>
          <p style={{ fontSize: '14px', fontWeight: '400' }}>Please Upgrade your plan to use this feature</p>
        </div>
      </Modal>
    </>

}