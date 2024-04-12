/**
 * Fetches and displays open and closed issues. Initializes WebSocket connection for live updates.
 */
async function displayIssues() {
  try {
    const response = await fetch('/api/issues');
    const issues = await response.json();

    const openIssuesElement = document.getElementById('open-issues');
    const closedIssuesElement = document.getElementById('closed-issues');
    
    openIssuesElement.innerHTML = '<h2>Open Issues</h2>';
    closedIssuesElement.innerHTML = '<h2>Closed Issues</h2>';

    // Populating issues
    issues.forEach(issue => {
      createIssueInList(issue, openIssuesElement, closedIssuesElement)
    });

  } catch (error) {
    console.error('Failed to fetch issues:', error);
  }

  // Setting up Webcosket for live updates
  setupWebSocket();
}


/**
 * Creates an HTML element for an issue and adds it to the correct section based on its status.
 * 
 * @param {Object} issue - The issue object containing details like id and state.
 * @param {HTMLElement} openIssuesElement - The container for open issues.
 * @param {HTMLElement} closedIssuesElement - The container for closed issues.
 */
async function createIssueInList(issue, openIssuesElement, closedIssuesElement) {
  const issueElement = document.createElement('div');
  issueElement.setAttribute('class', 'issue-container');
  issueElement.setAttribute('data-issue-id', issue.id);
  if (issue.state === 'opened') {
    issueElement.classList.add('open-issue');
    openIssuesElement.appendChild(issueElement);
  } else {
    issueElement.classList.add('closed-issue');
    closedIssuesElement.appendChild(issueElement);
  }
  presentIssue(issue, issueElement);
}

/**
 * Set up a Websocket connection and defines event handlers for open, close, and message events.
 */
function setupWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const ws = new WebSocket(`${protocol}${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onclose = (event) => {
    console.log('WebSocket connection closed. Reconnecting...', event);
    setTimeout(setupWebSocket, 5000);
  };

  ws.onmessage = (event) => {
    try {
      const issueEvent = JSON.parse(event.data);
      const issueElement = document.querySelector(`[data-issue-id="${issueEvent.object_attributes.id}"]`);
      const action = issueEvent.object_attributes.action
      if (action === 'reopen' || action ==='close') {
        displayToggle(issueEvent.object_attributes)
        presentIssue(issueEvent.object_attributes, issueElement);
      } else if (action === 'open') {
        const openIssuesElement = document.getElementById('open-issues');
        const closedIssuesElement = document.getElementById('closed-issues');
        createIssueInList(issueEvent.object_attributes, openIssuesElement, closedIssuesElement)
      } else if (issueEvent.event_type === 'note') {
        const issueElement = document.querySelector(`[data-issue-id="${issueEvent.object_attributes.noteable_id}"]`);
        const commentsSection = issueElement.querySelector('.comments-section')
        const commentElement = document.createElement('div');
        commentElement.innerHTML = `
          <div class="comment-body">--> ${issueEvent.object_attributes.note}</div>
        `;
        commentsSection.appendChild(commentElement);
        commentsSection.style.display = 'block'
      }
    } catch (error) {
      console.error('Failed to parse message', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

/**
 * Presents information for a specific issue within a given HTML element.
 * This includes the issue's title, description, and interactive buttons for comments and status toggling.
 * @param {Object} issue - The issue object to display.
 * @param {HTMLElement} issueElement - The container element for the issue.
 */
async function presentIssue(issue, issueElement) {
  issueElement.innerHTML = `
    <div class="issue-content">
      <h2>${issue.title}</h2>
      <p>${issue.description}</p>
      <div class="button-container">
        <button class="view-comments-btn">View comments</button>
        <button class="comment-btn">Comment</button>
        <button class="toggle-btn">${issue.state === 'opened' ? 'Close' : 'Open'}</button>
      </div>
      <form class="comment-form" style="display: none;">
        <textarea class="comment-text" rows="4" cols="50" placeholder="Enter your comment here..."></textarea>
        <button type="button" class="submit-comment-btn">Submit</button>
      </form>
      <div class="comments-section" style="display: none;">
      </div>
    </div>
  `;

  issueElement.querySelector('.view-comments-btn').onclick = () => viewComments(issue, issueElement);
  issueElement.querySelector('.comment-btn').onclick = () => toggleCommentForm(issueElement);
  issueElement.querySelector('.toggle-btn').onclick = () => toggleIssue(issue);
  issueElement.querySelector('.submit-comment-btn').onclick = () => submitComment(issue);
}

/**
 * Fetches and displays comments for a specific issue, toggling visibility of the comments section.
 * @param {Object} issue - The issue object containing the identifier for the comments.
 * @param {HTMLElement} issueElement - The container element for the issue.
 */
async function viewComments(issue, issueElement) {
  
  try {
    const commentsResponse = await fetch(`/api/issues/${issue.iid}/comments`);
    const comments = await commentsResponse.json();
    
    const commentsSection = issueElement.querySelector('.comments-section');
    commentsSection.innerHTML = '';
    
    comments.forEach(comment => {
      if (comment.author.name === '****') {
        const commentElement = document.createElement('div');
        commentElement.innerHTML = `
          <div class="comment-body">--> ${comment.body}</div>
        `;
        commentsSection.appendChild(commentElement);
      }
      
    });
    
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  }
}

/**
 * Toggles the display of the comment form for an issue, allowing users to add new comments.
 * @param {HTMLElement} issueElement - The container element for the issue.
 */
function toggleCommentForm(issueElement) {
  const commentForm = issueElement.querySelector('.comment-form');
  commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
}

/**
 * Submits a new comment for an issue to the server and hides the comment form.
 * @param {Object} issue - The issue object to which the comment is being added.
 */
async function submitComment(issue) {
  const commentText = document.querySelector(`[data-issue-id="${issue.id}"] .comment-text`).value;
  toggleCommentForm(document.querySelector(`[data-issue-id="${issue.id}"]`))
  
  try {
    await fetch(`/api/issues/${issue.iid}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: commentText, issueIid: issue.iid})
    });
    
  } catch (error) {
    console.error('Failed to submit comment:', error);
  }
}

/**
 * Toggles the issue between open and closed, updating the UI accordingly.
 * @param {Object} issue - The issue object to toggle.
 */
async function toggleIssue(issue) {
  const fetchAction = issue.state === 'closed' ? 'reopen' : 'close';
  
  try {
    await fetch(`/api/issues/${issue.iid}/${fetchAction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    issue.state = fetchAction === 'reopen' ? 'opened' : 'closed';

    displayToggle(issue)

  } catch (error) {
    console.error('Failed to toggle issue:', error);
  }
}

/**
 * Reflects the toggle action in the UI, moving the issue between open and closed lists.
 * @param {Object} issue - The issue object that was toggled.
 */
async function displayToggle(issue) {
  const issueElement = document.querySelector(`[data-issue-id="${issue.id}"]`);
    if (issueElement) {
      const containerId = issue.state === 'opened' ? 'open-issues' : 'closed-issues';
      const oppositeContainerId = issue.state === 'opened' ? 'closed-issues' : 'open-issues';
      issueElement.classList.toggle('open-issue', issue.state === 'opened');
      issueElement.classList.toggle('closed-issue', issue.state === 'closed');
      document.getElementById(containerId).appendChild(issueElement);

      issueElement.querySelector('.toggle-btn').textContent = issue.state === 'opened' ? 'Close' : 'Open';

      const oppositeContainer = document.getElementById(oppositeContainerId);
      const oppositeIssueElement = oppositeContainer.querySelector(`[data-issue-id="${issue.id}"]`);
      if (oppositeIssueElement) {
        oppositeIssueElement.remove();
      }
    } else {
      console.log(`Issue element not found: ${issue.id}`);
    }
}

displayIssues();
