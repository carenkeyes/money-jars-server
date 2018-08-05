

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ynabRouter = require('./src/routers/ynabRouter');
const userRouter = require('./src/routers/userRouter');

const app = express();
const {PORT, CLIENT_ORIGIN, DATABASE_URL, TEST_DATABASE_URL} = require('./config')


app.use(express.static('public'));
app.use(morgan('common'))
app.use(express.json());
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
)

app.get('/api', (req, res) => {
  res.json({ok: true});
});

app.use('/api/ynab', ynabRouter);
app.use('/api/user', userRouter);

let server;

function runServer(databaseUrl, port = PORT){
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err =>{
            if (err) {
                return Promise.reject(err);
            }
            server = app.listen(port, () =>{
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
        
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}


function closeServer(){
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) =>{
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
module.exports = { runServer, app, closeServer };