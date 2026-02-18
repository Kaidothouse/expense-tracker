// Temporary auth service until real authentication is implemented
class AuthService {
  constructor() {
    this.userId = localStorage.getItem('userId') || '1';
  }

  getUserId() {
    return this.userId;
  }

  setUserId(id) {
    this.userId = id;
    localStorage.setItem('userId', id);
  }

  getAuthHeaders() {
    return {
      'x-user-id': this.userId
    };
  }
}

const authService = new AuthService();

export default authService;
