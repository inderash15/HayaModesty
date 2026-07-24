const loginHandler = require('../auth/login');

// Redirect admin/login POST queries to the unified auth/login handler
module.exports = async (req, res) => {
    return loginHandler(req, res);
};
