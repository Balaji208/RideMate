import React from "react";

const InfoItem = ({ icon, text }) => {
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-500 flex-shrink-0">{icon}</div>
      <p className="inter-font text-sm text-gray-800 ml-4">{text}</p>
    </div>
  );
};

export default InfoItem;