import jwt from 'jsonwebtoken';

export const signAccessToken = (userData, secret, options = {}) => {
  return new Promise((resolve, reject) => {
    const signOptions = {
      algorithm: 'HS256',
      ...options,
    };

    jwt.sign(userData, secret, signOptions, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};
