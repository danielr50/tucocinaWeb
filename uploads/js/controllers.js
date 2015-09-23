/*
	Project: TuCocinaVirtual
	Developer: Team Oglit
	Description:
		Contiene cada uno de los controladores encargados
		de gestionar el flujo de datos al usuario
	Date: 14/08/2015
*/

// modulo principal para los controladores de la aplicación
app = angular.module('tuCosina.controllers', ['ui.router', 'ngAnimate', 'satellizer', 'LocalStorageModule', 'mgcrea.ngStrap', 'firebase'])

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
	    $http.post('https://api-tucocina.herokuapp.com/api/restaurantes', restaurante)
		.success(function(data){
			$scope.ver = true;
			$scope.respuesta = 'Datos guardados!';
			// upload(fd);
		})
		.error(function(response){
			// si ha habido errors, llegaremos a esta función 
			console.log('ERROR');
		});
	}

// funcion para guardar el logo del restaurante
function upload (form) {
	$http.post('http://tucocinavirtual.com/test/uploads-logo.php',form, {
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
app.controller('panelController', ['$scope', '$http', 'localStorageService', 'Menu_categorias', 'Platos', 'Ingredientes', 'Adicionales', '$firebaseObject', function($scope, $http, localStorageService, Menu_categorias, Platos, Ingredientes, Adicionales, $firebaseObject){
	$scope.ver_ingrediente = false;
	$scope.ver_res_plato = false;
	$scope.ver = false;
	// Socket.on('categoria', function(categoria) {
 //    	console.log(categoria);
 //    	// $scope.categoriaadd = categoria.nombreCategoria;
	// });

	// cargar todas las categorias
	$scope.categorias = Menu_categorias;

	// cargar todos los platos
	$scope.platos = Platos;

	// function para agregar un nuevo plato
	$scope.addPlato = function(){
		// preparo la imagen
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen', file);

        // objeto plato
		$scope.platos.$add({
			nombrePlato: $scope.nombrePlato,
			descripcion: $scope.descripcion,
			valor: $scope.valor,
			estado: $scope.estado,
			idCategoria: $scope.categoria,
			imagen: file.name
		});

		upload(fd);

		$scope.ver_res_plato = true;
		$scope.respuesta_plato = 'El plato se guardó correctamente';

	}//fin addPlato

	// funcion para agregar un ingrediente a un plato por medio de su ID
	$scope.addIngrediente = function(){
		var id = localStorageService.get('idPlato');
		var ingrediente = {
			nombreIngrediente: $scope.nombreIngrediente,
			idPlato: id
		};
		Ingredientes.$add(ingrediente);
	}// fin addIngrediente

		// funcion para agregar un adicional a un plato por medio de su ID
	$scope.addAdicional = function(){
		var id = localStorageService.get('idPlato');
		console.log(id);
		var adicional = {
			nombreAdicional: $scope.nombreAdicional,
			valor: $scope.valorAdicional,
			idPlato: id
		};

		Adicionales.$add(adicional);
	}// fin addAdicional

	// funcion para guardar la imagen del plato
	function upload (form) {
		$http.post('http://tucocinavirtual.com/test/uploads.php',form, {
		    transformRequest: angular.identity, 
	        headers: {'Content-Type': undefined}
	        })
	        .success(function(response){
				console.log('Respuesta del server: '+response);
	        })
	        .error(function(response){
	    });
	};

	// function para agregar una categoria
	$scope.addCategoria = function(){
		console.log('Categoria');
		var file = $scope.imagen;
        var fd = new FormData();
        fd.append('imagen', file);

		$scope.categorias.$add({
			nombreCategoria: $scope.nombreCategoria,
			imagen: file.name
		});
		upload(fd);
		$scope.respuesta_categoria = 'Registro éxitoso!';
		$scope.ver = true;
	}

	// cargo los ingredientes de un plato
	$scope.ingredientesLoad = function(idPlato){
		$scope.ingredientes = null;
		localStorageService.set('idPlato', idPlato);

		var count = 0;
		var ing = [];

		var ingre = new Firebase("https://tucocina.firebaseio.com/ingredientes/");
		ingre.orderByChild("idPlato").equalTo(idPlato).on("child_added", function(snapshot) {
			count++;
			ing[count] = snapshot.val();
			$scope.ingredientes = ing.filter(Boolean);
			console.log($scope.ingredientes);
		});
	}

	// cargo los adiconales de un plato
	$scope.adicionalesLoad = function(idPlato){
		$scope.adicionales = null;
		localStorageService.set('idPlato', idPlato);
		
		var count = 0;
		var adi = [];

		var adicionales = new Firebase("https://tucocina.firebaseio.com/adicionales/");
		adicionales.orderByChild("idPlato").equalTo(idPlato).on("child_added", function(snapshot) {
			count++;
			adi[count] = snapshot.val();
			$scope.adicionales = adi.filter(Boolean);
		});
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