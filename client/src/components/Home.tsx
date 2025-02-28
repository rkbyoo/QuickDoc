import { Link } from "react-router-dom";
import { FaStethoscope } from "react-icons/fa";

const Home = () => {
  const featureClass =
    "bg-white p-4 rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-blue-100 transition-colors duration-300";

  return (
    <div className="max-h-screen bg-gradient-to-b from-blue-100 to-blue-50 flex flex-col items-center justify-center rounded-3xl p-14 h-max">
      <div className="max-w-screen-lg mx-auto text-center">
        <FaStethoscope className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to QuickDoc
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Optimize your doctor appointments with ease.
        </p>
        <div className="mb-12 space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 text-pretty">
          <div className={featureClass}>
            <span className="text-blue-500 mr-2">✓</span>
            Hassle-free and fast appointment booking with some basic details
          </div>
          <div className={featureClass}>
            <span className="text-blue-500 mr-2">✓</span>
            Easy to use, user-friendly interface
          </div>
          <div className={featureClass}>
            <span className="text-blue-500 mr-2">✓</span>
            Automated allocation of doctors based on medical symptoms
          </div>
        </div>
        <div className="flex flex-row justify-evenly max-w-[1000px]">
          <Link
            to="/medicAssistant"
            className="bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center justify-center mx-auto hover:bg-gray-600 hover:shadow-lg border border-transparent hover:border-gray-600 transition-all duration-300 max-w-[200px]"
          >
            Book an Appointment
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </Link>
          <Link
            to="/login"
            className="bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center justify-center mx-auto hover:bg-gray-600 hover:shadow-lg border border-transparent hover:border-gray-600 transition-all duration-300 max-w-[200px]"
          >
            join as receptionalist
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
