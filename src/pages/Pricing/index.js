import { FaRegCheckCircle } from "react-icons/fa";


import { useEffect, useRef, useState } from "react";
import PricingTable from './Table/PricingTable';
import { plans } from './Data/Plans';
import {
  FirstCardDetails,
  FourthCardDetails,
  SecondCardDetails,
  ThirdCardDetails,
} from "./Data/ListItems";

const Pricing = () => {
  const cardRefs = useRef([]);
  const [cardHeight, setCardHeight] = useState(0);

  useEffect(() => {
    if (cardRefs.current.length > 0) {
      const heights = cardRefs.current.map((card) => card.offsetHeight);
      setCardHeight(Math.max(...heights));
    }
  }, []);

  const navigateToExternalPage = (buttonLink) => {
    window.location.href = buttonLink;
  };

  const PricingCard = ({
    title,
    listData,
    description,
    price,
    buttonText,
    buttonLink,
    index,
  }) => (
    <div
      ref={(el) => (cardRefs.current[index] = el)}
      style={{ height: cardHeight || "auto" }}
      className="card shadow mb-4 h-100 "
    >
      <div className="card-body d-flex flex-column ">
        <h5 className="card-title border-bottom border-light-subtle py-1 text-center text-uppercase fw-bold mb-3">
          {title}
        </h5>

        <p className="card-text text-center text-muted mb-4">{description}</p>
        <h6 className="text-center my-3">
          <span className="fs-4 fw-bold">{price}</span>
          <span className="ms-2 text-muted">per/month</span>
        </h6>
        <ul className="list-unstyled mb-4">
          {listData.map(({ text }, index) => (
            <li
              key={index}
              className="d-flex align-items-center mb-2"
              style={{ fontSize: "18px" }}
            >
              <div
                className="mx-2"
                style={{
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FaRegCheckCircle
                  style={{ fontSize: "18px", color: "green" }}
                />
              </div>

              <span>{text}</span>
            </li>
          ))}
        </ul>
        <button
          className="btn  text-light fw-bold btn-info w-100 mt-auto"
          onClick={() => navigateToExternalPage(buttonLink)}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );


  return (
    <>
     
        <div className="container py-5 my-3   ">
          <br />

          <div className="row g-3 ">
            <h3 className="text-center">Plans & Pricing</h3>
            <strong className="text-center text-muted">
              Find the right plan for your goals
            </strong>
            <div className="col-12 col-sm-6 col-md-3 ">
              <PricingCard
                index={0}
                listData={FourthCardDetails}
                title="Free"
                description="Basic Chat & Basic ML"
                price="0"
                buttonText="GET STARTED"
                buttonLink="/login"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <PricingCard
                index={1}
                listData={FirstCardDetails}
                title="Basic"
                description="Basic Chat & Basic ML"
                price="99"
                buttonText="GET STARTED"
                buttonLink="https://superprofile.bio/vp/676a743280809a00134c2119"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <PricingCard
                index={2}
                listData={SecondCardDetails}
                title="Standard"
                description="Elevate your client services with branded analytics and API integration."
                price="1999"
                buttonText="CONTACT US"
                buttonLink="/contact"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <PricingCard
                index={3}
                listData={ThirdCardDetails}
                title="Advanced"
                description="Serious agencies start here."
                price="2999"
                buttonText="CONTACT US"
                buttonLink="/contact"
              />
            </div>

            <div className="col-12">
              <h1 className="text-3xl font-bold text-center mb-8">
                Pricing Comparison
              </h1>
            </div>
            <div className="col-12 ">
              <PricingTable plans={plans} />
            </div>

          </div>
        </div>
    
    </>
  );
};

export default Pricing;
