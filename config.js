require('dotenv').config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost/money-jars',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-money-jars',
    PORT: process.env.PORT || 8080,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    REDIRECT_URI: process.env.REDIRECT_URI || 'http://localhost:8080/api/ynab/auth',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    OAUTH_CODE: process.env.OAUTH_CODE
}