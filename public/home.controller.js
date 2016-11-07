'use strict'

angular.module('benchpressApp')
  .controller('HomeCtrl', function ($log, $http) {
    var ctrl = this

    $http.get('/first').then(function (response) {
        $log.log(response.data)
        ctrl.opinionLead = response.data
    }).catch(function (err) {
        $log.error(err)
    })
    
  })
