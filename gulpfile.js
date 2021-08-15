const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const mainBowerFiles = require('main-bower-files');
// var jade = require('gulp-jade');
// var plumber = require('gulp-plumber'); //讓發生錯誤不會停止
// var watch = require('gulp-watch');
// var postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');
const gulpSequence = require('gulp-sequence');
// const imageMin = require('gulp-imagemin');
//minimist 區分開發/產品環境
var envOptions = {
    string: 'env',
    default: { env : 'develop' }
}

var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

//清除資料夾
gulp.task('clean', function(){
    return gulp.src(['./.tmp','./public'], {read:false})
    .pipe($.clean());
})


gulp.task('jade', function () {
    return gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            pretty: true
            // locals:YOUR_LOCALS
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});

gulp.task('sass', function () {
    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //編譯完成
        .pipe($.postcss([autoprefixer()]))//插入autoprofixer套件
        .pipe($.if (options.env === 'production', $.cleanCss())) //判斷是否壓縮css
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css/'))
        .pipe(browserSync.stream());
});

gulp.task('babel', function () {
    return gulp.src('./source/js/**/*.js')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['es2015']
        }))
        //合併
        .pipe($.concat('all.js'))
        //尋找來源
        .pipe($.if (options.env === 'production', $.uglify({
            compress: {
                drop_console: true//省略console.log
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe( browserSync.stream());
});

gulp.task('bower', function () {
    return gulp.src(mainBowerFiles())
        .pipe($.uglify())//壓縮js
        .pipe(gulp.dest('./.tmp/vendors'))
})
//處理外部載入
gulp.task('vendorJs', ['bower'], function () {
    return gulp.src('./.tmp/vendors/**/**.js')
        .pipe($.concat('vendors.js'))
        .pipe($.if (options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/js'))
})

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('image-min', ()=>{
    return gulp.src('./source/images/*')
    .pipe($.if (options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'))
})

gulp.task('watch', function () {
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/js/**/*.js', ['babel']);

});

gulp.task('build', gulpSequence('clean','jade','sass','babel','vendorJs','image-min')) //發布流程
                                                                                //owser-sync  watch為開發流程
gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'image-min', 'browser-sync', 'watch']);