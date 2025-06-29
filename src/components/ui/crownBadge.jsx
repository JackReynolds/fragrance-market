/* eslint-disable react/prop-types */

import React from "react";
import { Crown } from "lucide-react";

const CrownBadge = ({ outerWidth, outerHeight, crownWidth, crownHeight }) => {
  return (
    <div
      className={`w-${outerWidth} h-${outerHeight} bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center cursor-help`}
    >
      <Crown className={`w-${crownWidth} h-${crownHeight} text-gray-800`} />
    </div>
  );
};

export default CrownBadge;
