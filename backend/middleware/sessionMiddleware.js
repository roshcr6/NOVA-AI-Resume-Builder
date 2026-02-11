const { Session } = require('../models');

const sessionMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required in x-session-id header'
      });
    }
    
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }
    
    let session = await Session.findOne({ sessionId });
    
    if (!session) {
      session = await Session.create({ sessionId });
    } else {
      session.lastActivity = new Date();
      await session.save();
    }
    
    req.sessionId = sessionId;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Session validation failed'
    });
  }
};

module.exports = sessionMiddleware;
