/**
 * Contains functions for handling RESTful API operations related to issues.
 */
const RESTful = {
  
  /**
   * Fetches all issues from the GitLab API and sends them in the response.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  fetchAllIssues: async (req, res) => {
    const API_URL = `${process.env.API_URL}/projects/${process.env.PROJECT_ID}/issues`
    
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${process.env.ACCESS_TOKEN}` }
      });
  
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
  
      const issues = await response.json();
      res.json(issues);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

  /**
   * Closes an issue by sending a request to the GitLab API.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  closeIssue: async (req, res) => {
    try {
      await RESTful.toggleIssue(req, res, 'close');
    } catch (error) {
      console.error('Failed to close issue:', error);
      res.status(500).send('Server error');
    }
  },

  /**
   * Reopens an issue by sending a request to the GitLab API.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  openIssue: async (req, res) => {
    try {
      await RESTful.toggleIssue(req, res, 'reopen');
    } catch (error) {
      console.error(`Failed to open issue:`, error);
      res.status(500).send('Server error');
    }
  },

  /**
   * Toggles the state of an issue between open and closed.
   * This is a helper function used by closeIssue and openIssue.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {string} action - The action to perform ('close' or 'reopen').
   */
  toggleIssue: async (req, res, action) => {
    const issueId = req.params.id;
    const API_URL = `${process.env.API_URL}/projects/${process.env.PROJECT_ID}/issues/${issueId}`

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state_event: action })
      });
      const data = await response.json();

      res.status(200).json(data);
    } catch (error) {
      console.error(`Failed to ${action} issue:`, error);
      res.status(500).send('Server error');
    }
  },

  /**
   * Adds a new comment to an issue using the GitLab API.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  addComment: async (req, res) => {
    const API_URL = `${process.env.API_URL}/projects/${process.env.PROJECT_ID}/issues/${req.body.issueIid}/notes`
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: req.body.comment })
      });
      
      const data = await response.json();

      res.status(201).json({ message: 'Comment added successfully', data });
    } catch (error) {
      console.error('Failed to add comment:', error);
      res.status(500).send('Server error');
    }
  },

  /**
   * Retrieves comments for a specific issue from the GitLab API.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  getComments: async (req, res) => {
    const API_URL = `${process.env.API_URL}/projects/${process.env.PROJECT_ID}/issues/${req.params.id}/notes`
    
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
      });
      
      const comments = await response.json();
      res.status(200).json(comments);
    } catch (error) {
      console.error('Failed to retrieve comments:', error);
      res.status(500).send('Server error');
    }
  }
    
}

export default RESTful;

