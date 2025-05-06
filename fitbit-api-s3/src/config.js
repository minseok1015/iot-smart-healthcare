const dotenv = require('dotenv');
const path   = require('path');

dotenv.config();                       // .env 로드

// CommonJS에서는 __dirname / __filename 기본 제공
const TOKEN_FILE = path.join(__dirname, '..', 'token.json');

module.exports = {
  CLIENT_ID:     process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  TOKEN_FILE
};
