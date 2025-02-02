exports.getHomepage = (req, res, next) => {
  res.status(200);
  res.render('homepage');
};
