// This module handles user authentication including login, homepage access, and logout functionalities.
const login = {

  /**
   * Processes login requests. If credentials match environment variables, the user is redirected to the issues page.
   * Otherwise, returns to the login page with an error message.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  login: async (req, res) => {
    if (req.body.username === process.env.USER_NAME && req.body.password === process.env.PASSWORD) {
      req.session.username = req.body.username
      res.render('issues')
    } else {
      res.render('index', { errMsg: "Incorrect username and/or password!" })
    }
  },

  /**
   * Displays the homepage for logged-in users or redirects to the login page if not authenticated.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  homepage: async (req, res) => {
    if (req.session.username === process.env.USER_NAME) {
      res.render('issues')
    } else { 
      res.render('index', { errMsg: null })
    }
  },

  /**
   * Ends the user session and redirects to the login page.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  logout: (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/')
    })
  }

}

export default login;