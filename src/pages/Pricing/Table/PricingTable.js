import React from "react";
import { FaCheck } from "react-icons/fa6";

const PricingTable = ({ plans }) => {
  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features))
  );

  return (
    <div className="table-responsive px-4 py-6 p-2">
      <table className="table table-bordered table-hover rounded-2 ">
        <thead className="table-light shadow-lg">
          <tr>
            <th className="text-start">Features</th>
            {plans.map((plan, index) => (
              <th key={index} className="text-center">
                <div className="fw-bold">{plan.title}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="shadow-sm ">
          {allFeatures.map((feature, featureIndex) => (
            <tr key={featureIndex}>
              <td className="text-start">{feature}</td>
              {plans.map((plan, planIndex) => (
                <td
                  key={`${planIndex}-${featureIndex}`}
                  className="text-center"
                >
                  {plan.features.includes(feature) ? (
                    <span className="fw-bold text-success">
                      <FaCheck style={{fontWeight:"900"}} />
                    </span>
                  ) : (
                    <span className="text-danger fw-bold">✘</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;
