import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import routing from './route/route.mjs';
import session from 'express-session';

// Loads environment variables into process.env
dotenv.config({ path: './accesstoken.env' });

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Set up view engine and views directory
app.set('view engine', 'ejs')
app.set('views', 'src/views')

// Middleware to parse requests
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static('src/public'));

// Session config 
app.use(session({
  secret: 'MinHemliga->-SuperHemliga->-Nyckel',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 900000, // 15 min
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  }
}))

// Routing middleware
app.use('/', routing);

/**
 * WebSocket server event listener for new connections.
 * Initializes client tracking for connection status and sets up message and close event listeners.
 */
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => console.log('Client disconnected'));
});

/**
 * Pinging to maintain websocket connection.
 */
setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

/**
 * Broadcasts data to all connected WebSocket clients.
 * @param {Object} data - The data to be sent to all clients.
 */
function broadcastData(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * Endpoint to receive GitLab webhook events.
 * Validates request using a secret token and then broadcasts the event data.
 */
app.post('/webhook/gitlab', express.json(), (req, res) => {
  const token = req.headers['x-gitlab-token'];
  if (token !== process.env.GITLAB_WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  
  const issueEvent = req.body;

  broadcastData(issueEvent);
  res.status(200).send('Webhook received');
});

/**
 * Starts the HTTP server on a specified port. Defaults to 5050.
 * @param {number} [port=5050] - The port on which the server will listen.
 */
export default async (port = 5050) => {
  try {
    server.listen(port, () => {
      console.log(`Listening at port ${port} on ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
  }
};
