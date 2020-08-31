let {src, dest, series, parallel, watch, lastRun,task} = require('gulp'),
 plugins = require("gulp-load-plugins")(),
 del = require('del'),
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
     src: 'src/skin/images/**',
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
//const changed = require('gulp-changed');
let autoprefixer = require('autoprefixer');
var pxtorem = require('postcss-pxtorem');
// 删除生成 build dev
function clean(cb) {
  del(['dev/**', 'build/**', 'rev/**']);
  cb()
}
function cleanPic(cb) {
  del(paths.img.build);
  cb()
}
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
//复制其它资源
/*
{allowEmpty: true}
当 globs 参数只能匹配一个文件(如 foo/bar.js)而且没有找到匹配时，会抛出一个错误，提示 "File not found with singular glob"。若要抑制此错误，请将 allowEmpty 选项设置为 true。

当在 globs 中给出一个无效的 glob 时，抛出一个错误，并显示 "Invalid glob argument"。
*lastRun()
* 检索在当前运行进程中成功完成任务的最后一次时间。最有用的后续任务运行时，监视程序正在运行。当监视程序正在运行时，对于后续的任务运行最有用。

当与 src() 组合时，通过跳过自上次成功完成任务以来没有更 改的文件，使增量构建能够加快执行时间。
* */
var fileSync = require('gulp-file-sync');

function copywatch () {
  /* var watcher=watch([paths.copy.src, '!src/skin/css/**'],copy);
*  watcher.on('unlink', function(path, stats) {
		 fileSync('src/skin/', 'dev/skin/');
		 console.log(`File ${path} was removed`);
	 
	 });*/
  watch([paths.copy.src, '!src/skin/css/**'],copy);
}
function copy (cb)  {
  src([paths.copy.src, '!src/skin/css/**'], {allowEmpty: true}, { base: 'src/' })
    .pipe(plumber(onError))
 .pipe(plugins.changed(paths.copy.dev, {hasChanged: plugins.changed.compareContents})) //比较源文件与目标文件是否不同 ,默认值比较上次修改时间 compareLastModifiedTime
 .pipe(dest(paths.copy.dev))
.pipe(plugins.notify("复制完成!"));
  fileSync('src/skin/', 'dev/skin/');
  cb()
}
exports.copy1 =  series(copy,copywatch);

/*
gulp.src("../test/fixtures/!*")
  .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
  .pipe(through(function () {
    this.emit("error", new Error("Something happend: Error message!"))
  }));*/

var
  //watch = require('gulp-watch'),
  path = require('path'),
  fileSystem = require('fs');

function a3(cb){
  watch('./src/**/*')
    .on('add', buildJs)
    .on('change', buildJs)
    .on('unlink', function(file){
      //删除文件
      var distFile = './dev/' + path.relative('./src', file); //计算相对路径
      fileSystem.existsSync(distFile);
    });
  cb()
}

function buildJs(file){
  src(file, {base : './src'}) //指定这个文件
/*    .pipe(minjs().on('error', function(error){
      console.error(error.message + '\n出错行号:' + error.lineNumber);
    }))*/
    .pipe(dest('./dev/skin/images/'));
}
// 编译 style
/*
*     .pipe(postcss([autoprefixer({
      browsers: [
        '>1%',
        'last 4 versions',
        'Firefox ESR',
        'not ie < 9',
        'iOS >= 8',
        'Android > 4.4'
      ],
      flexbox: 'no-2009',
    })]))
* */
function style(cb) {
  var processors = [
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
  src(paths.css.src, {allowEmpty: true}, {since: lastRun(style)},{ sourcemaps: true })
    .pipe(plumber(onError))
   .pipe(plugins.sourcemaps.init({loadMaps: true, largeFile: true}))
   .pipe(plugins.less())
   .pipe(plugins.cssSpriter({
     // The path and file name of where we will save the sprite sheet
     // Because we don't know where you will end up saving the CSS file at this point in the pipe,
     // we need a litle help identifying where it will be.
       'spriteSheet': './dev/skin/images/spritesheet.png',  // 生成的spriter图片存放的位置
       'pathToSpriteSheetFromCSS': '../images/spritesheet.png' // 生成后的样式文件图片引用地址的路径
   }))
   .pipe(plugins.postcss(processors))
 /*  .pipe(plugins.postcss([
    autoprefixer({
      cascade: false,
      grid: true
    }),
     pxtorem()
   ]))*/
   .pipe(plugins.cleanCss({
     keepSpecialComments: '*', //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
     compatibility: 'ie8',    //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
     keepBreaks: true,       //类型：Boolean 默认：false [是否保留换行]
     advanced: false       //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
   }))
   .pipe(plugins.sourcemaps.write('./maps/'))
   .pipe(plugins.changed(paths.css.dev, {hasChanged: plugins.changed.compareContents}))
   .pipe(dest(paths.css.dev),{ sourcemaps: true })
   .pipe(plugins.filter('**/*.css'))
   .pipe(reload({stream: true}));
  cb()
}
function csswatch() {
  watch(paths.css.src, style);
}
exports.css = series(style, csswatch)
// html
function file(cb) {
  src(paths.html.src)
   .pipe(plugins.fileInclude({
    // prefix: '@@', //变量前缀 @@include
     //basepath: '@file' //它可以是 @root，@file，your-basepath
     //basepath:'@root'
   }))
   .pipe(dest(paths.html.dev))
   .pipe(plugins.filter('**/*.html'))
   .pipe(reload({stream: true}));
  cb();
}

//编译 ES6
function script(cb) {
  src(paths.js.src, {sourcemaps: true}, {allowEmpty: true}, {since: lastRun(script)})
    .pipe(plugins.babel({
      presets: ['@babel/preset-env']

    }))
    .pipe(plugins.rev())
    .pipe(dest(paths.js.dev))
    .pipe(plugins.rev.manifest())// 生成一个rev-mainfest.json
    .pipe(dest('./rev/js'))
    //.pipe(plugins.filter('**/*.js'))
    .pipe(reload({stream: true}))
  cb();
}

//压缩 js
var vinylPaths = require('vinyl-paths');
exports.deljs = (cb) =>(
  src(paths.js.build)
  .pipe(dest(paths.js.build))
  .pipe(vinylPaths(del))
)
function minjs(cb) {
  
  let min = plugins.filter([paths.js.src,'!src/skin/js/common-js.js', '!src/skin/js/*.min.js', '!src/skin/js/layer/**'], {restore: true});
  src(paths.js.src,{allowEmpty: true}, {since: lastRun(minjs)},{ sourcemaps: true })
    .pipe(min)
    .pipe(plugins.sourcemaps.init({loadMaps: true, largeFile: true}))
   // .pipe(plugins.changed(paths.css.dev, {hasChanged: changed.compareSha1Digest},{exception:'.js'})) //gulp-changed还提供了一种比较函数：内容的对比。将源文件和目标文件的内容进行sha1加密后，比较两者的加密串，若不相同，则通过管道。可通过传递参数修改比对函数：
    .pipe(dest(paths.js.dev))
    .pipe(plugins.babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(plugins.uglify())
    .pipe(min.restore)
    .pipe(plugins.rev())
    .pipe(plugins.sourcemaps.write('./maps/'))
    .pipe(plugins.stripDebug()) //从JavaScript代码中删除console，alert和debugger语句
    .pipe(dest(paths.js.build),{ sourcemaps: true })
    .pipe(plugins.rev.manifest())// 生成一个rev-mainfest.json
    .pipe(dest('./rev/js'))
    .pipe(plugins.filter('**/*.js'))
    .pipe(reload({stream: true}))
  cb();
}


// 压缩 image
exports.img2 = () => (
  src('src/skin/images/**/*.{png,jpg,jpeg}')
    .pipe(tinypng({
      key: 'vfVy4nmrP0ycPZwgHzDXc126mQFD3Q1R',
      sigFile: 'src/skin/images/.tinypng-sigs',
      log: true,
      //sameDest:true  ,//src 和图片输出为同一路径
      summarize:true
    }))
    .pipe(dest('dev/skin/images'))
);
var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed')
function img (cb) {
  src(paths.img.src + '/*.{png,jpg,jpeg}', {allowEmpty: true})
    .pipe(plugins.newer('dev/skin/images'))
    //.pipe(changed(paths.css.dev))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 80}),//压缩质量
      imagemin.optipng({optimizationLevel: 5, errorRecovery: false, interlaced: 'null'}),
    ]))
    .pipe(dest('dev/skin/images'))
  cb()
}
var cache = require('gulp-cached');
var  remember = require('gulp-remember');
exports.img =img
function aa () {
 var watcher = watch(paths.img.src, img);
/*  watcher.on('all', function (event) {
    if (event.type === 'deleted') {
      delete cache.caches['img'][event.path];
      remember.forget('img', event.path);
    }
  });*/
}
exports.aa =aa
//var cssBase64 = require('gulp-css-base64')
exports.base = function (cb) {
    src('src/skin/css/c1.css')
      .pipe(plugins.cssBase64({
        baseDir: '../images',
        maxWeightResource: 32768,
      }))
        .pipe(dest('dev/skin/css/'))
    cb()
}

exports.a1 = function (cb) {
    src('src/skin/css/**')
     .pipe(plugins.cssSpriter({
       'spriteSheet': './dev/skin/images/spritesheet.png',  // 生成的spriter图片存放的位置
       'pathToSpriteSheetFromCSS': '../images/spritesheet.png' // 生成后的样式文件图片引用地址的路径
     }))
        .pipe(dest('dev/skin/css/'));
    cb()
}
























//server
function dev(cb) {
  browserSync.init({
    server: {
      baseDir: paths.html.dev,
      index: 'index.html'
      
    },
    notify: false,
  });
  watch(paths.css.src, style);
  watch(paths.html.src_all, file);
  watch([paths.copy.src, '!src/skin/css/**'], png);
  cb()
}
exports.clean = clean;
exports.copy = copy;
exports.style = style;
exports.file = file;
exports.dev = dev;
//exports.mincss = mincss;
exports.script = script;
exports.minjs = minjs;
//exports.online = online;
//exports.rev = rev;
//exports.default = parallel(parallel(copy, style,file), series(dev));
//exports.build = parallel(series(cleanPic, pic), copy, style, script, file, series(online));
