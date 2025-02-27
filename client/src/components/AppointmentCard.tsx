import React, { useState, useEffect } from 'react';

// Define the shape of each appointment
interface Appointment {
  name: string;
  address: string;
  phoneNumber: string;
  doctor: string;
  visited: boolean;
  confirmed: boolean;
}

const AppointmentCard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://your-api-endpoint/appointments');
      const data: Appointment[] = await response.json();
      setAppointments(data);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
        Doctor Appointments
      </h1>

      <div className="w-full max-w-5xl flex flex-col flex-grow">
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {appointments.map((appointment, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">
                    {appointment.name}
                  </h2>
                  <span
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${
                      appointment.confirmed
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {appointment.confirmed ? 'Confirmed' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 text-gray-600 text-sm sm:text-base">
                  <p>
                    <span className="font-medium text-gray-800">Address:</span>{' '}
                    {appointment.address}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Phone:</span>{' '}
                    {appointment.phoneNumber}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Doctor:</span>{' '}
                    {appointment.doctor}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Visited:</span>{' '}
                    <span
                      className={
                        appointment.visited ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {appointment.visited ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          // Centered no appointments message & button
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <p className="text-gray-500 text-lg sm:text-xl mb-4">
              No appointments found...
            </p>
            <button
              onClick={fetchData}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        ) : (
          // Centered loading state
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <p className="text-center text-gray-500 text-lg sm:text-xl">
              Loading...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
