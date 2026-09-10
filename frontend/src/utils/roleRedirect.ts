export const getRoleRedirectPath = (role: string): string => {
  switch (role) {
    case 'worker': return '/worker/home';
    case 'supervisor': return '/supervisor/dashboard';
    case 'authority': return '/authority/overview';
    default: return '/unauthorized';
  }
};