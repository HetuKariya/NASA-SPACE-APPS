import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
        
        <div className="px-6 py-8">
          <div className="flex items-center -mt-16 mb-6">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-700">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{user?.username}</h2>
          <p className="text-gray-600 mb-6">{user?.email}</p>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">User ID</span>
                <span className="text-sm text-gray-900 font-mono">{user?.id}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Username</span>
                <span className="text-sm text-gray-900">{user?.username}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-900">{user?.email}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Member Since</span>
                <span className="text-sm text-gray-900">{formatDate(user?.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-500">OAuth Providers</span>
                <span className="text-sm text-gray-900">
                  {user?.oauthProviders?.length > 0 
                    ? user.oauthProviders.join(', ') 
                    : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
