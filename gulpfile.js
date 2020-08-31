const {src, dest, series, parallel, watch, lastRun} = require('gulp'),
	plugins = require("gulp-load-plugins")(),
	del = require('del'),
	autoprefixer = require('autoprefixer'),
	pxtorem = require('postcss-pxtorem'),
	imagemin = require('gulp-imagemin'),
	browserSync = require('browser-sync').create(),
	reload = browserSync.reload,
	paths = {
		css: {
			src: 'src/skin/css/**/*.*',
			dev: 'dev/skin/css/',
			build: 'build/skin/css/'
		},
		js: {
			src: 'src/skin/js/**/*.*',
			dev: 'dev/skin/js/',
			build: 'build/skin/js/'
		},
		img: {
			src: 'src/skin/images/**/*.*',
			dev: 'dev/skin/images/',
			build: 'build/skin/images/'
		},
		html: {
			src: 'src/*.html',
			src_all: 'src/**/*.html',
			dev: 'dev/',
			build: 'build/'
		},
		copy: {
			src: 'src/skin/**/*.*',
			dev: 'dev/skin/',
			build: 'build/skin/'
		}
	};
let processors = [
	autoprefixer({
		cascade: false,
		grid: true
	}),
	pxtorem({
		rootValue: 75,//根元素字体大小基准值
		unitPrecision: 5, //允许REM单位小数点位数。
		propList: ['*'], //可以从px更改为rem的属性。
		selectorBlackList: [], // （字符串，数组,正则表达式）要忽略的选择器，保留为px。
		replace: true,//(布尔值）替换包含rems的规则
		mediaQuery: false, //（布尔值）允许在媒体查询中转换px
		minPixelValue: 0, //（数字）设置要替换的最小像素值
		exclude: /node_modules/i //（字符串，正则表达式，函数）要忽略并保留为px的文件路径
		//忽略单个属性的最简单方法是在像素单位声明中使用大写字母
		// postcss-pxtorem`会忽略 ` Px`或`PX`，但仍被浏览器接受
	})
];
let cleanCss = {
	keepSpecialComments: '*', //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
	compatibility: 'ie8',    //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
	keepBreaks: true,       //类型：Boolean 默认：false [是否保留换行]
	advanced: false       //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
};
let cssSpriter = {
	'spriteSheet': './dev/skin/images/spritesheet.png',  // 生成的spriter图片存放的位置
	'pathToSpriteSheetFromCSS': '../images/spritesheet.png' // 生成后的样式文件图片引用地址的路径
};
// 删除生成 build dev
function clean () {
	del(['dev/**', 'build/**', 'rev/**'])
}
function cleanPic(cb) {
	del(paths.img.build);
	cb()
}
function deljs () {
	del(paths.js.dev)
}
function delcss () {
	del(paths.css.dev)
}
// 复制所需素材
function copy () {
	src([paths.copy.src, '!src/skin/css/**'], {allowEmpty: true}, {base: 'src/'})
		.pipe(plugins.newer(paths.copy.dev))
		.pipe(dest(paths.copy.dev))
}
// 编译 style
function style (cb) {
	src(paths.css.src, {allowEmpty: true}, {since: lastRun(exports.style)}, {sourcemaps: true})
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.newer(paths.css.dev))
		.pipe(plugins.less())
		//.pipe(plugins.postcss([autoprefixer({cascade: false, grid: true})])) //未加px转rem
		.pipe(plugins.cssSpriter(cssSpriter))
		.pipe(plugins.postcss(processors))
		.pipe(plugins.cssBase64({
			baseDir: '../images',
			maxWeightResource: 32768,
		}))
		// .pipe(plugins.cleanCss(cleanCss))
		.pipe(plugins.sourcemaps.write('./maps/'))
		.pipe(dest(paths.css.dev), {sourcemaps: true})
		.pipe(plugins.filter('**/*.css'))
		.pipe(reload({stream: true}))
	cb()
}


//压缩图片
function img (cb) {
	src(paths.img.src, {allowEmpty: true})
		.pipe(plugins.newer(paths.img.dev))
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.mozjpeg({quality: 80}),//压缩质量
			imagemin.optipng({optimizationLevel: 5, errorRecovery: false, interlaced: 'null'}),
		]))
		.pipe(plugins.changed(paths.img.dev, {hasChanged: plugins.changed.compareContents}))
		.pipe(dest(paths.img.dev))
	cb()
}
// Base64
exports.base = function (cb) {
	src('src/skin/css/*.css')
		.pipe(plugins.cssBase64({
			baseDir: '../images',
			maxWeightResource: 32768,
		}))
		.pipe(dest('dev/skin/css/'))
	cb()
}

//编译 ES6 压缩 js
function minjs(cb) {
	let min = plugins.filter([paths.js.src,'!src/skin/js/common-js.js', '!src/skin/js/*.min.js', '!src/skin/js/layer/**'], {restore: true});
	src(paths.js.src,{allowEmpty: true}, {since: lastRun(minjs)},{ sourcemaps: true })
		.pipe(min)
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.stripDebug())
		.pipe(plugins.newer(paths.js.dev))
		.pipe(dest(paths.js.dev))
		.pipe(plugins.babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(plugins.uglify())
		.pipe(min.restore)
		.pipe(plugins.rev())
		.pipe(plugins.sourcemaps.write('./maps/'))
		.pipe(plugins.changed(paths.css.dev, {hasChanged: plugins.changed.compareContents}))
		.pipe(dest(paths.js.build),{ sourcemaps: true })
		.pipe(plugins.rev.manifest())
		.pipe(dest('./rev/js'))
		.pipe(plugins.filter('**/*.js'))
		.pipe(reload({stream: true}))
	cb();
}
function file (cb) {
	src(paths.html.src)
		.pipe(plugins.newer(paths.html.dev))
		.pipe(plugins.fileInclude())
		.pipe(dest(paths.html.dev))
		.pipe(plugins.filter('**/*.html'))
		.pipe(reload({stream: true}))
	cb()
}
// rev
function rev(cb) {
	src(['rev/**/*.json', 'dev/*.html'])
		.pipe(plugins.revCollector())
		.pipe(dest(paths.page.dev))
		.pipe(dest(paths.page.build))
		.pipe(reload({stream: true}));
	cb();
}
//同步文件
function sync() {
	watch(['src/*.*'], function() {
		plugins.fileSync('src/skin/', 'dev/skin/', {recursive: false});
	});
	/* var watcher=watch([paths.copy.src, '!src/skin/css/**'],copy);
*  watcher.on('unlink', function(path, stats) {
	 fileSync('src/skin/', 'dev/skin/');
	 console.log(`File ${path} was removed`);
 
 });*/
}

//server
function dev(cb) {
	browserSync.init({
		server: {
			baseDir: paths.html.dev
		},
		notify: false,
	});
	watch(paths.css.src, style);
	watch(paths.js.src, minjs);
	watch(paths.html.src_all, file);
	watch([paths.copy.src, '!src/skin/css/**'], copy);
	cb()
}
//生产 上线
function online(cb) {
	src('./build')
		.pipe(vinylPaths(del))
	browserSync.init({
		server: {
			baseDir: paths.page.build
		},
		notify: false,
	});
	/*  browserSync({
			files: "./",
			server: {
				baseDir: paths.page.build
			},
			logLevel: "debug", //info 只是显示基本信息  debug 显示了我对过程的其他信息
			logPrefix: "My Project", //改变控制台日志前缀
			logConnections: true, //记录连接
			notify: false, //不显示在浏览器中的任何通知
			online: true,// //不会尝试确定你的网络状况，假设你在线。
		});*/
	cb()
}

exports.clean = clean;
exports.copy = copy;
exports.style = style;
exports.file = file;
exports.dev = dev;
//exports.mincss = mincss;
//exports.script = script;
exports.minjs = minjs;
//exports.online = online;
exports.rev = rev;
//exports.default = parallel(parallel(copy,style,minjs,file), series(dev));
//exports.build = parallel(series(cleanPic, pic), copy, style, script, file, series(online));
exports.default = series(parallel(copy, style, minjs, file), series(dev));
//exports.build = parallel(series(cleanPic, pic), copy, style, minjs, file, series(online));
/*
*
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
function onError(error) {
  const title = error.plugin + ' ' + error.name
  const msg = error.message
  const errContent = msg.replace(/\n/g, '\\A ')
  
  notify.onError({
    title: title,
    message: errContent,
    sound: true
  })(error)
  
  this.emit('end')
}
.pipe(plumber(onError))
*
* */
