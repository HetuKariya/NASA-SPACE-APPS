export const userService = {
  getProfile: async () => {
    return api.get('/protected/profile');
  },

  updateProfile: async (userData) => {
    return api.put('/protected/profile', userData);
  },

  deleteAccount: async () => {
    return api.delete('/protected/account');
  },

  getUserData: async () => {
    return api.get('/protected/user-data');
  },
};

export default userService;