export const authService = {
  register: async (userData) => {
    return api.post('/authorize/register', userData);
  },

  login: async (username, password) => {
    return api.post('/authorize/login', { username, password });
  },

  logout: async () => {
    return api.post('/authorize/logout');
  },

  getCurrentUser: async () => {
    return api.get('/authorize/me');
  },

  googleAuth: async (credential) => {
    return api.post('/authorize/google', { credential });
  },
};

export default authService;