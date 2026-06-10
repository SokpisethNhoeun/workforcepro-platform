<?php

use App\Http\Controllers\SwaggerController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/docs', 'swagger')->name('swagger.ui');
Route::redirect('/swagger', '/docs');
Route::redirect('/api/documentation', '/docs');
Route::get('/openapi.json', SwaggerController::class)->name('swagger.openapi');
