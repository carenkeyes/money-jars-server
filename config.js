require('dotenv').config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost/money-jars',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-money-jars',
    PORT: process.env.PORT || 8080,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    REDIRECT_URI: process.env.REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    OAUTH_CODE: process.env.OAUTH_CODE,
    ENV: process.env.NODE_ENV || 'production',
    SECRET: process.env.JWT_SECRET,
    EXPIRATION: 864000,
}