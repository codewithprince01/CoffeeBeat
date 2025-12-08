// Fix for authService register function
// Add this to the register function in authService.js

const response = await api.post('/auth/register', {
  name: userData.name,
  email: userData.email,
  password: userData.password,
  inviteToken: userData.inviteToken  // ADD THIS LINE
});
