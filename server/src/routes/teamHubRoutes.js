const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  getTasks,
  createTask,
  updateTaskStatus,
} = require('../controllers/teamHubController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:id/status', updateTaskStatus);

module.exports = router;
