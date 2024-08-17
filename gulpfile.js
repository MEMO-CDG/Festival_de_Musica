import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import {src, dest, watch, series } from 'gulp';
// src es una funcion que nos va a permitir acceder a ciertos archivos, que son los archivos fuentes donde estan ubicados
// dest es donde se ubicaran o donde seran almacenados
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';

import terser from 'gulp-terser';
import sharp from 'sharp';

const sass = gulpSass(dartSass);

export function js(done){
    src('src/js/app.js')
    .pipe(terser())
    .pipe(dest('build/js'))
    
    done();
}

export function css(done) {
    // ubicamos que archivo de sass es el que queremos compilar con src 
    src('src/scss/app.scss', {sourcemaps: true})
    // dentro de el primer pipe se pondra la funcion de sass que es para compilar
    .pipe(sass({
        outputStyle: 'compressed'
    }).on('error', sass.logError)) // estos pipes nos permiten ejecutar una funcion cada que termina otra da control sobre como se tienen que ir ejecutando las diferentes funciones.
    // Es como ir llamando una funcion tras otra, pero gulp da el ccontrol sobre el orden en el cual se van a ir ejecutando las funciones por medio de los pipes.
    .pipe(dest('build/css', {sourcemaps: '.'}))
    // en este segundo pipe pondremos la ubicacion de guardado.
    // Aqui en lugar de solo dar la ubicacion como en el package.json 
    // debemos de dar tambien cual es el archivo que va a compilar
    // damos la ubicacion de donde se guardara la compilación con dest
    
    done();
}

export async function crop(done) {
    const inputFolder = 'src/img/gallery/full'
    const outputFolder = 'src/img/gallery/thumb';
    const width = 250;
    const height = 180;
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    const images = fs.readdirSync(inputFolder).filter(file => {
        return /\.(jpg)$/i.test(path.extname(file));
    });
    try {
        images.forEach(file => {
            const inputFile = path.join(inputFolder, file)
            const outputFile = path.join(outputFolder, file)
            sharp(inputFile) 
                .resize(width, height, {
                    position: 'centre'
                })
                .toFile(outputFile)
        });

        done()
    } catch (error) {
        console.log(error)
    }
}

export async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './build/img';
    const images =  await glob('./src/img/**/*{jpg,png}')

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}

function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true })
    }
    const baseName = path.basename(file, path.extname(file))
    const extName = path.extname(file)
    const outputFile = path.join(outputSubDir, `${baseName}${extName}`)
    const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`)
    const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`)

    const options = { quality: 80 }
    sharp(file).jpeg(options).toFile(outputFile)
    sharp(file).webp(options).toFile(outputFileWebp)
    sharp(file).avif().toFile(outputFileAvif)
}

export function dev() {
    watch('src/scss/**/*.scss', css);
    watch('src/js/**/*.js', js);
    watch('src/img/**/*.jpg', imagenes);
    
    
}

export default series(crop, js, css, imagenes, dev);