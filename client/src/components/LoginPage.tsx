import React, { useState, ChangeEvent, FormEvent } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import frameImage from "../assets/frame.png";
import mainImage from "../assets/login.jpg";
import { IoArrowBack } from "react-icons/io5"; // Importing an arrow icon from react-icons

// Define the type for form data
interface FormData {
  receptionistId: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    receptionistId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const changeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      if (response.status === 200) {
        toast.success("Login Successful");
        navigate("/appointments");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Either Receptionist ID or password incorrect");
    }
  };

  // Function to handle going back
  const handleBack = () => {
    navigate(-1); // Goes back to the previous page in history
  };

  return (
    <div className="flex justify-between w-11/12 max-w-[1160px] py-12 mx-auto gap-x-12 gap-y-0 text-white">
      <div className="w-11/12 max-w-[450px] relative">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-[-8rem] left-0 flex items-center gap-2 text-richblack-5 hover:text-blue-100 transition-colors duration-200"
        >
          <IoArrowBack size={24} />
          <span>Back</span>
        </button>

        <h1 className="text-richblack-5 font-semibold text-[1.875rem] leading-[2.375rem]">
          Welcome Back
        </h1>
        <p className="text-[1.125rem] leading-[1.625rem] mt-4">
          <span className="text-richblack-100">
            Login to access your dashboard
          </span>
          <br />
          <span className="text-blue-100 italic">
            Secure access for reception staff
          </span>
        </p>

        <form onSubmit={submitHandler}>
          <div className="mt-5">
            <label className="w-full">
              <p className="text-[0.875rem] text-richblack-5 mb-1 leading-[1.375rem]">
                Receptionist ID<sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type="number"
                name="receptionistId"
                onChange={changeHandler}
                placeholder="Enter 10-digit Receptionist ID"
                value={formData.receptionistId}
                maxLength={10}
                pattern="\d{10}"
                className="bg-richblack-800 rounded-[0.5rem] text-black w-full p-[12px]"
              />
            </label>
          </div>

          <div className="relative mt-5">
            <label className="w-full">
              <p className="text-[0.875rem] text-richblack-5 mb-1 leading-[1.375rem]">
                Password<sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={changeHandler}
                placeholder="Enter Password"
                value={formData.password}
                className="bg-richblack-800 rounded-[0.5rem] text-black w-full p-[12px]"
              />
              <span
                className="absolute right-3 top-[30px] cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                ) : (
                  <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                )}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 rounded-[8px] font-medium text-black px-[12px] py-[8px] mt-10"
          >
            Log In
          </button>
        </form>
      </div>

      <div className="relative w-11/12 max-w-[450px] rounded-md mr-[5rem] mt-[2rem]">
        <img
          src={frameImage}
          alt="Pattern"
          width={558}
          height={504}
          loading="lazy"
          className="rounded-md"
        />
        <img
          src={mainImage}
          alt="Pattern"
          width={540}
          height={486}
          loading="lazy"
          className="rounded-md absolute bottom-[8px] left-[8px]"
        />
      </div>
    </div>
  );
};

export default LoginPage;
