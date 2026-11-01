const net = require('node:net');
const s = net.createServer();
s.listen(0, '127.0.0.1', () => {
  const p = s.address().port;
  s.close(() => {
    process.stdout.write(String(p));
    process.exit(0);
  });
});
