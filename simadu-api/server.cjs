const config = require('./src/config.cjs');
const app = require('./app.cjs');

app.listen(config.port, () => {
  console.log(`SIMADU API berjalan di http://localhost:${config.port}`);
  console.log(`Swagger UI           di http://localhost:${config.port}/docs`);
});
