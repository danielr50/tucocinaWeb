/*
	Project: TuCocinaVirtual
	Developer: Team Oglit
	Description:
		Contiene cada uno de los controladores encargados
		de gestionar el flujo de datos al usuario
	Date: 14/08/2015
*/

// modulo principal para los controladores de la aplicación
app = angular.module('tuCosina.controllers', ['ui.router', 'ngAnimate', 'satellizer', 'LocalStorageModule', 'mgcrea.ngStrap'])

// para enviar el token con cada peticion http
app.config(['$httpProvider', 'satellizer.config', function($httpProvider, config){
	$httpProvider.interceptors.push(['$q', function($q){
		var tokenName = config.tokenPrefix ? config.tokenPrefix + '_' + config.tokenName : config.tokenName;
		return {
			request: function(httpConfig){
				var token = localStorage.getItem(tokenName);
				if(token && config.httpInterceptor){
					token = config.authHeader === 'Authorization' ? 'Bearer' + token: token;
					httpConfig.headers[config.authHeader] = token;
				}
				return httpConfig;
			},
			responseError: function(response){
				return $q.reject(response);
			}
		};
	}]);
}]);

// controllar para la vista home
app.controller('homeController', ['$scope', function($scope){

}]); // fin controlador home

// controllar para la vista login
app.controller('loginController', ['$scope', '$auth', '$location', 'localStorageService', function($scope, $auth, $location, localStorageService){
	var vm = this;
	// función para lguearse como restaurante en el sistema
	this.login = function(){
		$auth.login({
			usuario: vm.usuario,
			password: vm.password
		})
		.then(function(data){
			// si ha ingresado correctamente, lo tratamos aqui
			// podemos tambien redigirle a una ruta
			localStorageService.set('idUser', data.data.userId);
			console.log(data);
			$location.path('/panel');
		})
		.catch(function(response){
			// si ha habido errores
			console.log(response);
		});

	}

}]); //fin controlador login

// controllar para la vista signup
app.controller('signupController', ['$scope', '$http', function($scope, $http){
	$scope.ver = false;

	var vm = this;
	this.signup = function(){
		// preparo la imagen
		var file = vm.logo;
	    var fd = new FormData();
	    fd.append('foto', file);

	    var restaurante = {
	    	usuario: vm.usuario,
			password: vm.password,
			nombreRestaurante: vm.nombreRestaurante,
			nit: vm.nit,
			tipoEstablecimiento: vm.tipoEstablecimiento,
			numMesaReserva: vm.numMesaReserva,
			logo: file.name
	    };
	    $http.post('http://localhost:8000/api/restaurantes', restaurante)
		.success(function(data){
			$scope.ver = true;
			$scope.respuesta = 'Datos guardados!';
			upload(fd);
		})
		.error(function(response){
			// si ha habido errors, llegaremos a esta función 
			console.log('ERROR');
		});
	}

// funcion para guardar el logo del restaurante
function upload (form) {
	$http.post('http://localhost:3000/uploads-logo.php',form, {
	    transformRequest: angular.identity, 
        headers: {'Content-Type': undefined}
        })
        .success(function(response){
			console.log('Respuesta: '+response);
        })
        .error(function(response){
    });
};


}]); // fin controlador signup

// controlador para el panel
app.controller('panelController', ['$scope', '$http', function($scope, $http){
	// cargar todas las categorias
	$http.get('http://localhost:8000/api/categorias')
		.success(function(data){
			$scope.categorias = data;
		})
		.error(function(err){
			console.log(err);
		})

	// cargar todos los platos
	$http.get('http://localhost:8000/api/platos')
		.success(function(data){
			$scope.platos = data;
		})
		.error(function(err){
			console.log(err);
		})

	// function para agregar un nuevo plato
	$scope.addPlato = function(){
		// preparo la imagen
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen', file);

        // objeto plato
		var plato = {
			nombrePlato: $scope.nombrePlato,
			descripcion: $scope.descripcion,
			valor: $scope.valor,
			estado: $scope.estado,
			idCategoria: $scope.categoria,
			imagen: file.name
		};

		// Peticion POST al API
		$http.post('http://localhost:8000/api/platos', plato)
			.success(function(data){
				console.log(data.plato);
				// $scope.platos = data.plato;
				upload(fd);
			})
			.error(function(err){
				console.log(err);
			})
	}//fin addPlato

	// funcion para guardar la imagen del plato
	function upload (form) {
		$http.post('http://localhost:3000/uploads.php',form, {
		    transformRequest: angular.identity, 
	        headers: {'Content-Type': undefined}
	        })
	        .success(function(response){
				console.log('Respuesta: '+response);
	        })
	        .error(function(response){
	    });
	};

	// function para agregar una categoria
	$scope.addCategoria = function(){
		var categoria = {
			nombreCategoria: $scope.nombreCategoria
		};
		// petición POST al API
		$http.post('http://localhost:8000/api/categorias', categoria)
			.success(function(data){
				console.log(data.categoria);
			})
			.error(function(err){
				console.log(err);
			})
	}
}]); //fin controler panel



// ***********************************************************************************************
// directiva para enviar la imagen al server
// esto deberia estar en un archivo independiente, es solo que es mi primera directiva xD
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
 
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])