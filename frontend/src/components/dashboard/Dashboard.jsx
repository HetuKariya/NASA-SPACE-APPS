import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome Back!</h3>
            <p className="text-blue-700">
              Hello, {user?.username}! You're successfully logged in.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Account Status</h3>
            <p className="text-green-700">Active</p>
            <p className="text-sm text-green-600 mt-2">
              Member since: {formatDate(user?.createdAt)}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Email</h3>
            <p className="text-purple-700 break-words">{user?.email}</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">1</p>
              <p className="text-sm text-gray-600 mt-1">Active Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">100%</p>
              <p className="text-sm text-gray-600 mt-1">Account Health</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">Secure</p>
              <p className="text-sm text-gray-600 mt-1">Authentication</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;