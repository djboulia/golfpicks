var gulp = require('gulp'),
    debug = require('gulp-debug'),
    nodemon = require('gulp-nodemon'),
    loopbackAngular = require('gulp-loopback-sdk-angular'),
    usemin = require('gulp-usemin'),
    wrap = require('gulp-wrap'),
    connect = require('gulp-connect'),
    watch = require('gulp-watch'),
    minifyCss = require('gulp-cssnano'),
    minifyJs = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    minifyHTML = require('gulp-htmlmin');

var paths = {
    server: 'server/**/*.{js,json}',
    models: 'common/**/*.{js,json}',
    scripts: 'client/src/js/**/*.*',
    cssstyles: 'client/src/css/**/*.*',
    styles: 'client/src/less/**/*.*',
    images: 'client/src/img/**/*.*',
    templates: 'client/src/templates/**/*.html',
    index: 'client/src/index.html',
    mobile: 'client/src/mobile/**/*.*',
    bower_fonts: 'client/src/components/**/*.{ttf,woff,eof,svg}'
};

var mobile_paths = {
    scripts: 'client/src/mobile/js/**/*.*',
    services_scripts: ['client/src/js/cloud-objects/**/*.*','client/src/js/services/**/*.*'],
    cssstyles: 'client/src/mobile/css/**/*.*',
    styles: 'client/src/mobile/less/**/*.*',
    images: 'client/src/mobile/images/**/*.*',
    templates: 'client/src/mobile/templates/**/*.html',
    index: 'client/src/mobile/index.html',
    bower_fonts: 'client/src/components/**/*.{ttf,woff,eof,svg}'
};

/** BEGIN MOBILE SECTION **/

/**
 * Handle bower components from index
 */
gulp.task('mobile-usemin', function () {
    return gulp.src(mobile_paths.index)
        .pipe(usemin({
            js: [minifyJs(), 'concat'],
            css: [minifyCss({
                keepSpecialComments: 0
            }), 'concat'],
        }))
        .pipe(gulp.dest('client/dist/mobile'));
});

/**
 * Handle custom files
 */
gulp.task('mobile-build-custom', ['mobile-custom-images', 'mobile-custom-js', 'mobile-custom-services-js', 'mobile-custom-less', 'mobile-custom-templates']);

gulp.task('mobile-custom-images', function () {
    return gulp.src(mobile_paths.images)
        .pipe(gulp.dest('client/dist/mobile/images'));
});

gulp.task('mobile-custom-js', function () {
    return gulp.src(mobile_paths.scripts)
        .pipe(sourcemaps.init())
        .pipe(debug())
//        .pipe(minifyJs())
        .pipe(concat('golfpicks.min.js'))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('client/dist/mobile/js'));
});

gulp.task('mobile-custom-services-js', function () {
    return gulp.src(mobile_paths.services_scripts)
        .pipe(sourcemaps.init())
        .pipe(debug())
//        .pipe(minifyJs())
        .pipe(concat('golfpicks-services.min.js'))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('client/dist/mobile/js'));
});

gulp.task('mobile-custom-less', function () {
    return gulp.src(mobile_paths.styles)
        .pipe(less())
        .pipe(gulp.dest('client/dist/mobile/css'));
});

gulp.task('mobile-custom-templates', function () {
    return gulp.src(mobile_paths.templates)
        .pipe(minifyHTML())
        .pipe(gulp.dest('client/dist/mobile/templates'));
});

/** END MOBILE SECTION **/


/**
 * Handle bower components from index
 */
gulp.task('usemin', function () {
    return gulp.src(paths.index)
        .pipe(usemin({
            js: [minifyJs(), 'concat'],
            css: [minifyCss({
                keepSpecialComments: 0
            }), 'concat'],
        }))
        .pipe(gulp.dest('client/dist/'));
});

/**
 * Copy assets
 */
gulp.task('build-assets', ['copy-bower_fonts', 'copy-mobile-bower_fonts']);

gulp.task('copy-bower_fonts', function () {
    return gulp.src(paths.bower_fonts)
        .pipe(rename({
            dirname: '/fonts'
        }))
        .pipe(gulp.dest('client/dist/lib'));
});

gulp.task('copy-mobile-bower_fonts', function () {
    return gulp.src(mobile_paths.bower_fonts)
        .pipe(rename({
            dirname: '/fonts'
        }))
        .pipe(gulp.dest('client/dist/mobile/lib'));
});

/**
 * Handle custom files
 */
gulp.task('build-custom', ['custom-images', 'custom-js', 'custom-less', 'custom-templates']);

gulp.task('custom-images', function () {
    return gulp.src(paths.images)
        .pipe(gulp.dest('client/dist/img'));
});

gulp.task('custom-js', function () {
    return gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
        .pipe(debug())
        .pipe(minifyJs())
        .pipe(concat('dashboard.min.js'))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('client/dist/js'));
});

gulp.task('custom-less', function () {
    return gulp.src(paths.styles)
        .pipe(less())
        .pipe(gulp.dest('client/dist/css'));
});

gulp.task('custom-templates', function () {
    return gulp.src(paths.templates)
        .pipe(minifyHTML())
        .pipe(gulp.dest('client/dist/templates'));
});

/**
 * auto-generate angular $resource handlers from LoopBack services
 **/
gulp.task('build-strongloop-angular', function () {
    return gulp.src('./server/server.js')
        .pipe(loopbackAngular())
        .pipe(rename('lb-services.js'))
        .pipe(gulp.dest('./client/dist/js'))
        .pipe(gulp.dest('./client/dist/mobile/js'));
;
});

/**
 * Watch custom files
 */
gulp.task('watch', function () {
    gulp.watch([paths.models], ['build-strongloop-angular']);
    gulp.watch([paths.server], ['build-strongloop-angular']);
    gulp.watch([paths.images], ['custom-images']);
    gulp.watch([paths.cssstyles], ['usemin']);
    gulp.watch([paths.styles], ['custom-less']);
    gulp.watch([paths.scripts], ['custom-js']);
    gulp.watch([paths.templates], ['custom-templates']);
    gulp.watch([paths.index], ['usemin']);
    gulp.watch([mobile_paths.images], ['mobile-custom-images']);
    gulp.watch([mobile_paths.cssstyles], ['mobile-usemin']);
    gulp.watch([mobile_paths.styles], ['mobile-custom-less']);
    gulp.watch([mobile_paths.scripts], ['mobile-custom-js']);
    gulp.watch([mobile_paths.services_scripts], ['mobile-custom-services-js']);
    gulp.watch([mobile_paths.templates], ['mobile-custom-templates']);
    gulp.watch([mobile_paths.index], ['mobile-usemin']);
});

gulp.task('start', function () {
    nodemon({
            script: 'server/server.js',
            ext: 'js json html',
            env: {
                'NODE_ENV': 'development'
            }
        })
        .on('restart', function () {
            console.log('restarted!')
        })
});

/**
 * Gulp tasks
 */
gulp.task('mobile-build', ['mobile-usemin', 'mobile-build-custom']);
gulp.task('build', ['mobile-build', 'usemin', 'build-assets', 'build-custom',
                    'build-strongloop-angular']);
gulp.task('default', ['build', 'start', 'watch']);
