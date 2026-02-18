const authenticate = (req, res, next) => {
  const userHeader = req.header('x-user-id');
  const userId = Number.parseInt(userHeader, 10);

  if (!userHeader || Number.isNaN(userId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = { id: userId };
  return next();
};

module.exports = authenticate;
