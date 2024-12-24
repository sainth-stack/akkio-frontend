import Pricing from "../../../../../../Pricing"
import { CommonCardHeader } from "../../common/card-header"
import { Header } from "../../common/header"
export const Billing = () => {
    return (
      <>
        <div style={{ padding: "50px" }}>
          <div>
            <Header {...{ userName: "Test User", header: "Billing" }} />
            <CommonCardHeader
              {...{
                header: "Billing",
                button: (
                  <button className="btn btn-primary">Buy Plan Now</button>
                ),
                Children: (
                  <div
                    style={{
                      display: "flex",
                      gap: "40px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ borderRight: "1px solid lightgrey" }}>
                      <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                        Active Until
                      </h2>
                      <h1
                        style={{
                          font: '500 20px/20px "Inter", sans-serif',
                          marginRight: "10px",
                        }}
                      >
                        March 25
                      </h1>
                    </div>
                    <h2 style={{ font: '400 14px/20px "Inter", sans-serif' }}>
                      During your free trial you have full access to every
                      feature of Akkio, allowing you to explore all its
                      capabilities without restrictions.
                    </h2>
                  </div>
                ),
              }}
            />
          </div>
          <div className="d-flex  align-items-center vh-100">
                    <Pricing />
                    
          </div>
        </div>
      </>
    );
}