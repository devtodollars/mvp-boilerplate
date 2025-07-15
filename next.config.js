module.exports = {
  images: {
    domains: [
      'pypzcnsltqjbnjjohplo.supabase.co',
    ],
  },
  rewrites: async () => {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      }
    ];
  }
};
