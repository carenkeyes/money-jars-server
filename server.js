const express = require('expres')
const app = express();

app.get('/api/*', (req, res) => {
    res.json({ok: true});
});

app.listen(PORT, () => console.log('Listening on port ${PORT}'));

module.export = {app}