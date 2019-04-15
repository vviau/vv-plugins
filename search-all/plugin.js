
arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("cubewiseSearchAll", "Search All", "page", {
      menu: "tools",
      icon: "fa-search-plus",
      description: "This plugin can be used to search an dimension element ID",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);

arc.directive("cubewiseSearchAll", function () {
   return {
      restrict: "EA",
      replace: true,
      scope: {
         instance: "=tm1Instance"
      },
      templateUrl: "__/plugins/search-all/template.html",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", "ngDialog", function ($scope, $rootScope, $http, $tm1, $translate, $timeout, ngDialog) {

         // Store the active tab index
         $scope.selections = {
            dimension: '',
            hierarchy: '',
            subset: ''
         };

         $scope.options = {
            searched: false,
            searchDimensions: true,
            searchProcesses: true,
            searchCubes: true
         }

         $scope.lists = {
            dimensions: [],
            processes: []
         }

         $scope.elementToSearch = '';

         //Search dimensions
         $scope.getDimensions = function () {
            $scope.options.searched = false;
            $http.get(encodeURIComponent($scope.instance) + "/Dimensions?$filter=DefaultHierarchy/Elements/any(e: contains(replace(toupper(e/Name),' ',''), '" + $scope.elementToSearch.toUpperCase() + "'))").then(function (result) {
               $scope.lists.dimensions = result.data.value;
               $scope.options.searched = true;
            });
         };

         //Search dimensions
         $scope.getProcesses = function () {
            $scope.options.searched = false;
            $http.get(encodeURIComponent($scope.instance) + "/Processes?$select=Name&$filter=contains(toupper(PrologProcedure), '" + $scope.elementToSearch.toUpperCase() + "') or contains(toupper(MetadataProcedure), '" + $scope.elementToSearch.toUpperCase() + "') or contains(toupper(DataProcedure), '" + $scope.elementToSearch.toUpperCase() + "') or contains(toupper(EpilogProcedure), '" + $scope.elementToSearch.toUpperCase() + "')").then(function (result) {
               $scope.lists.processes = result.data.value;
               $scope.options.searched = true;
            });
         };

         //Search dimensions
         $scope.getCubes = function () {
            $scope.options.searched = false;
            $http.get(encodeURIComponent($scope.instance) + "/Cubes?$select=Name&$filter=Rules ne null and contains(toupper(Rules),'" + $scope.elementToSearch.toUpperCase() + "')").then(function (result) {
               $scope.lists.cubes = result.data.value;
               $scope.options.searched = true;
               console.log($scope.lists.cubes);
            });
         };


         // Search All
         $scope.searchAll = function () {
            $scope.lists.processes = [];
            $scope.lists.dimensions = [];
            $scope.lists.cubes = [];
            if ($scope.options.searchDimensions) {
               $scope.getDimensions();
            }
            if ($scope.options.searchProcesses) {
               $scope.getProcesses();
            }
            if ($scope.options.searchCubes) {
               $scope.getCubes();
            }
            // get rules as well
         }

         //When typing enter
         $scope.key = function ($event) {
            //Arrow up
            if ($event.keyCode == 13) {
               $scope.searchAll();
            }
         }

         //Manage color:
         $scope.generateHSLColour = function (string) {
            //HSL refers to hue, saturation, lightness
            var styleObject = {
               "background-color": "",
               "color": "white"
            };
            //for ngStyle format
            var hash = 0;
            var saturation = "50";
            var lightness = "50";
            for (var i = 0; i < string.length; i++) {
               hash = string.charCodeAt(i) + ((hash << 5) - hash);
            }
            var h = hash % 360;
            styleObject["background-color"] = 'hsl(' + h + ', ' + saturation + '%, ' + lightness + '%)';
            return styleObject;
         };

         $scope.$on("login-reload", function (event, args) {

         });

         $scope.$on("close-tab", function (event, args) {
            // Event to capture when a user has clicked close on the tab
            if (args.page == "cubewiseSearchAll" && args.instance == $scope.instance && args.name == null) {
               // The page matches this one so close it
               $rootScope.close(args.page, { instance: $scope.instance });
            }
         });

         $scope.$on("$destroy", function (event) {

         });


      }]
   };
});