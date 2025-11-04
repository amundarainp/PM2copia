module.exports = {
  entry: './scripts/index.js', // crea src/index.js si no existe
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js',
  },
};
