const userSettings = require('./user.settings');
const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const styleLintPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const utils = require('./webpack/utils');

var env = process.env.NODE_ENV || 'dev';
var production = env === 'prod';
var hot = env === 'hot';

var date = new Date();


let filenameTemplate = function (template) {
	if (production) {
		return date.getFullYear()
			+ '/' + (date.getMonth() + 1).toString().padStart(2, '0')
			+ '-' + date.getDate().toString().padStart(2, '0')
			+ '/' + date.getHours().toString().padStart(2, '0')
			+ '-' + date.getMinutes().toString().padStart(2, '0')
			+ '-' + date.getSeconds().toString().padStart(2, '0')
			+ '-' + date.getMilliseconds().toString().padStart(3, '0')
			+ '/' + template;
	}
	return template;
};

let stats = {
	hash: false,
	version: false,
	timings: false,
	assets: false,
	chunks: false,
	modules: false,
	children: false,
	source: false,
	errors: true,
	errorDetails: true,
	warnings: true,
	colors: true,
};
Object.assign(stats, userSettings.stats);


/**
Plugins ******************************************************************************************************************
**/

var plugins = [
	new styleLintPlugin({
		syntax: userSettings.mainStyleType,
		emitError: false,
		emitWarning: true,
		quiet: false,
	}),

	new MiniCssExtractPlugin({
		filename: filenameTemplate('css/[name].css'),
	}),
	new AssetsPlugin({
		filename: path.join('assets', env + '.json'),
		path: __dirname,
		prettyPrint: true,
	}),
	new ESLintPlugin({}),
];

/**
Loaders ******************************************************************************************************************
**/

let cssLoader = {
	loader: 'css-loader',
	options: {
		sourceMap: !production,
		url: (url) => {
			if (url.startsWith('/')) {
				return false;
			}
			if (url.startsWith('../')) {
				return false;
			}
			return true;
		}
	}
};

let urlLoader = {
	loader: 'url-loader',
	options: {
		limit: userSettings.base64MaxFileSize,
		name: '[path][name].[ext]',
	}
};

let lessLoader = {
	loader: 'less-loader',
	options: {
		sourceMap: true,
		lessOptions: {
			paths: [path.resolve(__dirname, "src")],
		},
	},
};

let imageWebpackLoader = {
	loader: 'image-webpack-loader',
	options: userSettings.images
};

/**
Exports ******************************************************************************************************************
**/

let _exports = {
	stats: stats,
	mode: production ? 'production' : 'development',
	entry: userSettings.entry,
	devtool: production ? false : 'source-map',
	target: ['web', 'es5'],
	output: {
		path: utils.buildPath(env),
		filename: filenameTemplate('js/[name].js'),
		publicPath: utils.publicPath(env),
		devtoolModuleFilenameTemplate: '[absolute-resource-path]',
		devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]',
		libraryExport: 'default',
	},
	resolve: {
		extensions: ['jsx', '.js', '.scss', '.less', '.css', '.sass'],
		alias: {
			font: 'font',
		},
		byDependency: {
			style: {
				mainFiles: ["custom"],
			},
		},
		modules: [
			path.join(__dirname, 'src'),
			'.',
			'img',
			path.join(__dirname, 'node_modules'),
		],
		plugins: [
			new DirectoryNamedWebpackPlugin({
				honorPackage: false,
			}),
		],
	},
	resolveLoader: {
		modules: [path.join(__dirname, 'node_modules')],
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				use: [
					{
						loader: '@svgr/webpack',
					}
				],
			},
			{
				test: /\.jsx$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [{
					loader: 'babel-loader'
				}]
			},
			{
				test: /\.less$/,
				use: [MiniCssExtractPlugin.loader, cssLoader, lessLoader],
			},
			{
				test: /\.(scss|sass|css)$/,
				use: [MiniCssExtractPlugin.loader, cssLoader, 'sass-loader'],
			},
			{
				test: /\.(png|gif|jpe?g|svg|cur)$/i,
				include: [path.resolve(__dirname, 'img'), path.resolve(__dirname, 'node_modules')],
				use: [urlLoader, imageWebpackLoader],
			},
			{
				test: /\.woff2?(\?\S*)?$/i,
				use: [urlLoader],
			},
		]
	},
	plugins: plugins
}

if (userSettings.exposeGlobal) {
	userSettings.exposeGlobal.forEach(function (item) {
		_exports.module.rules.push({
			test: require.resolve(item.module),
			loader: 'expose-loader',
			options: {
				exposes: {
					globalName: item.name,
					override: true,
				}
			}
		});
	});
}

if (userSettings.aliases) {
	_exports.resolve.alias = Object.assign(_exports.resolve.alias, userSettings.aliases);
}

/**
Hot ******************************************************************************************************************
**/

if (hot) {
	_exports.output.publicPath = utils.hotUrl() + utils.publicPath('dev');
	_exports.devServer = {
		publicPath: _exports.output.publicPath,
		hot: true,
		historyApiFallback: true,
		stats: userSettings.stats,
		port: userSettings.hotPort,
		host: utils.hotHost(),
		disableHostCheck: true,
		https: {
			key: fs.readFileSync('/opt/techart/projectclone/config/ssl/server.key'),
			cert: fs.readFileSync('/opt/techart/projectclone/config/ssl/hot.crt'),
			ca: fs.readFileSync('/opt/techart/projectclone/config/ssl/generate/rootCA.pem'),
		},
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Expose-Headers": "*"
		}
	};
}

module.exports = _exports;
