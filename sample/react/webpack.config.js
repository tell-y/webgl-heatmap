const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode === 'development' ? 'development' : 'production';
  const devtool = mode === 'development' ? 'inline-source-map' : false;
  return [
    {
      mode,
      devtool,
      entry: ['./src/index.js'],
      output: {
        path: `${__dirname}/build`,
        filename: 'main.js',
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react'],
                },
              },
            ],
          },
        ],
      },
      resolve: {
        extensions: ['*', '.js', '.jsx'],
      },
      plugins: [
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: './src/index.html',
        }),
      ],
    },
  ];
};
