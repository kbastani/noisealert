var tracking = false;

var noiseAlertApp = angular.module( 'noiseAlertApp', [
'ngRoute',
'ngNoiseAlertControllers'
]);

noiseAlertApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: 'src/app/partials/home-detail.html',
        controller: 'NoiseAlertCtrl'
      }).
      otherwise({
        redirectTo: '/home'
      });
  }]);

var noiseAlertControllers = angular.module('ngNoiseAlertControllers', []);

noiseAlertControllers.controller('NoiseAlertCtrl', ['$scope', '$http',
  function ($scope, $http) {
    if(!$scope.containers)
      $scope.container = 0
  }]).directive('myCurrentTime', ['$interval', function($inteval) {

    function link(scope) {
        $( "#chart-container" ).unbind("noiseAlert").bind( "noiseAlert", function( e, dataModel, volumeOutput ) {
          scope.dataModel = dataModel;
          recreateChart(volumeOutput);
          scope.container++;

          // Delete fourth lowest
          var chartArray = $.map($(".charts"), function(a) {
            return parseFloat($(a).attr("data-volume-output"));
          });

          chartArray.sort();

          if(chartArray.length > 3) {
            // Remove first
            $(".charts").each(function(i, item) {
              if(parseFloat($(item).attr("data-volume-output")) == chartArray[0]) {
                $(item).highcharts().destroy();
                $(item).remove();
              }
            });
          }
        });

        function recreateChart(volumeOutput) {
          $("#chart-container").prepend('<div data-volume-output="' + volumeOutput + '" id="container-' + scope.container + '" class="charts" style="min-width: 310px; height: 200px; margin: 0 auto"></div>')

        $('#container-' + scope.container).highcharts({
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Noise alert chart: ' + volumeOutput
            },
            subtitle: {
                text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' :
                        'Pinch the chart to zoom in'
            },
            xAxis: {

            },
            yAxis: {
                title: {
                    text: 'Intensity'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },

            series: [{
                type: 'area',
                name: 'Output volume (50ms)',
                data: scope.dataModel
            }]
        });
      }
    };

    return {
      link: link
    };
  }]);
