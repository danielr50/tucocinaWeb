/*
	Project: TuCocinaVirtual
	Developer: Team Oglit
	Description:
		Permite configurar las rutas de la aplicacion web
		desde aca se asiganan cada uno de los controladores
		asociados a cada vista de la aplicación
	Date: 14/08/2015
*/

// modulo principal de la aplicación
var app = angular.module('tuCosina', ['tuCosina.controllers', 'tuCosina.services', 'angular-loading-bar']);

app.constant('firebaseUrl', 'https://tucocina.firebaseio.com/');

// configuración de las rutas para la aplicación web
app.config(function($stateProvider, $authProvider, $urlRouterProvider, firebaseUrl){
	
	// variables de configuracion para el envio de peticiones al server
	$authProvider.authHeader = 'Authorization';
	$authProvider.withCredentials = false; // Send POST request with credentials

	// parametros de configuracion
	$authProvider.loginUrl = "https://api-tucocina.herokuapp.com/auth/login";

	// configuración token local
	$authProvider.tokenName = "token";
	$authProvider.tokenPrefix = "TuCosina_App";

	// defino las rutas de la app
	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: 'partials/home.html',
			controller: 'homeController'
		})

		.state('panel',{
			url: '/panel',
			templateUrl:'partials/panel.html',
			controller: 'panelController',
			resolve:{
				'currentAuth': ['$firebaseAuth', function($firebaseAuth){
					// $requireAuth retorna promesa si esta autenticado, rechaza sino
					var ref = new Firebase(firebaseUrl);
					var authObj = $firebaseAuth(ref);

					return authObj.$requireAuth();
				}]
			}
		})

		.state('pedidos',{
			url: '/pedidos',
			templateUrl:'partials/pedidos.html',
			controller: 'pedidosController',
			resolve:{
				'currentAuth': ['$firebaseAuth', function($firebaseAuth){
					// $requireAuth retorna promesa si esta autenticado, rechaza sino
					var ref = new Firebase(firebaseUrl);
					var authObj = $firebaseAuth(ref);

					return authObj.$requireAuth();
				}]
			}
		})

		.state('promo', {
			url: '/promo',
			templateUrl: 'partials/promociones.html',
			controller: 'promoController',
			resolve:{
				'currentAuth': ['$firebaseAuth', function($firebaseAuth){
					// $requireAuth retorna promesa si esta autenticado, rechaza sino
					var ref = new Firebase(firebaseUrl);
					var authObj = $firebaseAuth(ref);

					return authObj.$requireAuth();
				}]
			}
		})

		.state('login', {
			url: '/login',
			templateUrl: 'partials/login.html',
			controller: 'loginController',
			controllerAs: 'login'
		})

		.state('signup',{
			url: '/signup',
			templateUrl: 'partials/signup.html',
			controller: 'signupController',
			controllerAs: 'signup'
		});

		$urlRouterProvider.otherwise('/');

});

