import { useState, useRef } from "react";

const OtpInput = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    const newOtp = [...otp];
    newOtp[index] = element.value;

    setOtp(newOtp);

    // Auto-focus next input
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    
  );
};

export default OtpInput;
