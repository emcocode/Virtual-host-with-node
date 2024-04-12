import express from "express";
import RESTful from "../public/js/RESTful.mjs";
import authentication from "../public/js/authentication.js";

const router = express.Router()

/**
 * Routes definition for the application.
 * Includes routes for the home page, issue operations, API endpoints for issues, and user logout.
 */

router.get('/', authentication.homepage)

router.get('/issues', authentication.homepage)

router.post('/issues', authentication.login)

router.get('/api/issues', RESTful.fetchAllIssues)

router.post('/api/issues/:id/close', RESTful.closeIssue)

router.post('/api/issues/:id/reopen', RESTful.openIssue)

router.post('/api/issues/:id/comments', RESTful.addComment)

router.get('/api/issues/:id/comments', RESTful.getComments)

router.get('/logout', authentication.logout)

export default router;