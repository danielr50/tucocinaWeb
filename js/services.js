/*
	Project: TuCocinaVirtual
	Developer: Team Oglit
	Description:
		Permite realizar las peticiones a la API
		para traer los datos que requiera el usuario
	Date: 14/08/2015
*/

var app = angular.module('tuCosina.services', ['LocalStorageModule', 'btford.socket-io'])


// //socket factory that provides the socket service
// angular.module('tuCosina.services').factory('Socket', ['socketFactory',
//     function(socketFactory) {
//         return socketFactory({
//             prefix: '',
//             ioSocket: io.connect('http://localhost:8000')
//         });
//     }
// ]);

app.factory('Socket', function(socketFactory) {
        return socketFactory({
            prefix: '',
            ioSocket: io.connect('https://api-tucocina.herokuapp.com')
            // ioSocket: io.connect('http://localhost:8000')
        });
});