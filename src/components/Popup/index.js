import { Modal } from 'react-bootstrap';
export const Popup = ({
    showModal,
    setShowModal,
    headerTitle,
    children,
    fullscreen,
    size="lg",
    estimate=false,
    footer=true,
    fixedTitle
}) => {
    return (
        <Modal size={size} fullscreen={fullscreen} show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>
                    <h5 style={{ fontFamily: "Poppins", fontSize: "20px" }}>{fixedTitle ? fixedTitle : `${headerTitle} ${estimate ? "(Estimated vs Actual)":"(Planned vs Actual)"}`}</h5>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{textAlign:"center",display:"flex",justifyContent:"center"}}>
                    {children}
                </div>
            </Modal.Body>
         {  footer && <Modal.Footer>
                <button className='btn btn-primary' onClick={() => setShowModal(false)}>Close</button>
            </Modal.Footer>}
        </Modal>
    )
}